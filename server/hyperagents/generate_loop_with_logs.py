# Copyright (c) Meta Platforms, Inc. and affiliates.
import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import docker

# ─── 1. 定义实时日志函数 (Manus Max 风格) ───────────────────────────────────
def log_step(step_type, message, data=None):
    """发送结构化 JSON 日志到标准输出，Node.js 后端将捕获并转发给前端"""
    log_entry = {
        "type": step_type, # 'thought', 'action', 'observation', 'score', 'patch'
        "message": message,
        "data": data,
        "timestamp": time.time()
    }
    print(json.dumps(log_entry), flush=True)

from analysis.plot_progress import plot_progress_single, plot_progress_together
from analysis.visualize_archive import (
    visualize_archive_single,
    visualize_archive_together,
)
from utils.common import file_exist_and_not_empty, load_json_file
from utils.constants import REPO_NAME
from utils.docker_utils import (
    build_container,
    cleanup_container,
    copy_from_container,
    copy_to_container,
    log_container_output,
    safe_log,
    setup_logger,
)
from utils.domain_utils import (
    can_domain_ensembled,
    get_domain_eval_subset,
    get_domain_splits,
    get_domain_stagedeval_samples,
)
from utils.gl_utils import (
    apply_diffs_container,
    get_patch_files,
    get_score,
    load_archive_data,
    run_commands_to_check_compilation,
    select_parent,
    setup_initial_gen,
    update_and_save_archive,
    update_node_metadata,
    get_latest_can_select_parent,
    is_starting_node,
    process_meta_patch_files,
)

def run_harness_polyglot(root_dir, output_dir, genid, skip_staged_eval=False, num_samples=-1):
    # NOTE: the harness for polyglot is different because each task instance needs a docker container
    from domains.polyglot.harness import harness as harness_polyglot
    from domains.polyglot.report import report as report_polyglot
    
    log_step("thought", f"正在开始第 {genid} 轮迭代评估...", {"genid": genid})
    
    eval_output_dir = os.path.join(output_dir, f"gen_{genid}", "polyglot_eval")
    test_more_threshold = 0.4  # NOTE: same setting as that in DGM
    model_name_or_path = "eval_run"
    
    patch_files = get_patch_files(output_dir, genid)
    log_step("patch", f"已获取第 {genid} 轮生成的代码补丁", {"patch_count": len(patch_files)})
    
    run_next_eval = True
    
    # Small sample size evaluation for staged eval
    if not skip_staged_eval:
        log_step("action", "执行小样本分阶段评估 (Staged Eval)...", {"subset": "small.json"})
        test_task_list = load_json_file("./domains/polyglot/subsets/small.json")
        dnames = harness_polyglot(
            test_task_list=test_task_list,
            num_samples=-1,
            max_workers=10,
            model_name_or_path=model_name_or_path,
            model_patch_paths=patch_files,
            num_evals=1,
            num_evals_parallel=1,
            pred_dname=eval_output_dir,
            output_dir=eval_output_dir,
            root_dir=root_dir,
        )
        report_polyglot(output_dir=eval_output_dir, run_keyword=model_name_or_path, expected_num_tasks=len(test_task_list))
        stagedeval_score = get_score("polyglot", output_dir, genid)
        
        # ─── 实时反馈分数 ───
        log_step("score", f"小样本评估完成，当前得分: {stagedeval_score}", {"score": stagedeval_score, "threshold": test_more_threshold})
        
        run_next_eval = stagedeval_score is not None and stagedeval_score >= test_more_threshold
        
        if run_next_eval:
            log_step("thought", f"得分 {stagedeval_score} 超过阈值 {test_more_threshold}，决定进行全量深度测试。")
        else:
            log_step("thought", f"得分 {stagedeval_score} 未达标，跳过全量测试，准备进入下一轮演化。")

    # Check if additional evaluation should be run
    if run_next_eval:
        log_step("action", "执行全量深度评估...", {"subset": "medium.json"})
        test_task_list_more = load_json_file("./domains/polyglot/subsets/medium.json")
        dnames = harness_polyglot(
            test_task_list=test_task_list + test_task_list_more,
            num_samples=num_samples,
            max_workers=10,
            model_name_or_path=model_name_or_path,
            model_patch_paths=patch_files,
            num_evals=1,
            num_evals_parallel=1,
            pred_dname=eval_output_dir,
            output_dir=eval_output_dir,
            root_dir=root_dir,
        )
        report_polyglot(output_dir=eval_output_dir, run_keyword=model_name_or_path, expected_num_tasks=len(test_task_list + test_task_list_more))
        
        final_score = get_score("polyglot", output_dir, genid)
        log_step("score", f"全量评估完成，最终得分: {final_score}", {"final_score": final_score})

    # Update metadata
    update_node_metadata(output_dir, genid, {"run_full_eval": run_next_eval})
    log_step("observation", f"第 {genid} 轮迭代元数据已更新，存档完毕。")

# ... 其余代码保持不变 ...
