#!/usr/bin/env python3
import os, sys, requests

def setup_branch_protection(token, owner, repo):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    
    url = f"https://api.github.com/repos/{owner}/{repo}/branches/main/protection"
    
    # 完整配置，包括 required_status_checks 和 restrictions
    protection_config = {
        "required_status_checks": {
            "strict": True,
            "contexts": []
        },
        "required_pull_request_reviews": {
            "dismiss_stale_reviews": True,
            "required_approving_review_count": 1
        },
        "enforce_admins": True,
        "allow_force_pushes": False,
        "allow_deletions": False,
        "restrictions": None
    }
    
    print("🔒 Setting up branch protection for 'main' branch...")
    print(f"   Repository: {owner}/{repo}")
    
    try:
        response = requests.put(url, json=protection_config, headers=headers)
        
        if response.status_code == 200:
            print("✅ Branch protection rules successfully configured!")
            print("\nConfigured rules:")
            print("  ✓ Require pull request before merging")
            print("  ✓ Require 1 approval")
            print("  ✓ Dismiss stale reviews")
            print("  ✓ Enforce admins")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

token = os.getenv("GITHUB_TOKEN")
owner = os.getenv("GITHUB_OWNER", "seanlab007")
repo = os.getenv("GITHUB_REPO", "mcmamoo-website")

if not token:
    print("❌ Error: GITHUB_TOKEN environment variable not set")
    sys.exit(1)

success = setup_branch_protection(token, owner, repo)
sys.exit(0 if success else 1)
