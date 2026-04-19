/**
 * FaceFusion 页面入口
 * 猫眼内容平台 - AI 面部融合模块
 */

import React from 'react';
import FaceFusionMain from '../components/FaceFusionMain';
import '../styles/facefusion.css';

const FaceFusionPage: React.FC = () => {
  return (
    <div className="facefusion-page">
      <div className="page-container">
        <FaceFusionMain />
      </div>
    </div>
  );
};

export default FaceFusionPage;
