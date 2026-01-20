/** 需求验证页面 - 重定向到需求列表 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerificationOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/requirements');
  }, [navigate]);

  return null;
};

export default VerificationOverviewPage;
