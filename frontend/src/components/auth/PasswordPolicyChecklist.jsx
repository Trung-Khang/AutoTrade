import React from 'react';
import { FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

const PasswordPolicyChecklist = ({ rules = [], value }) => {
  const isCompliant = rules.length > 0 && rules.every((rule) => rule.met);
  const hasTyped = value !== undefined ? Boolean(value) : rules.some((rule) => rule.met);

  if (!hasTyped) {
    return (
      <div className="password-hint-msg default">
        <FaInfoCircle className="hint-icon info" />
        <span>Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!)</span>
      </div>
    );
  }

  if (isCompliant) {
    return (
      <div className="password-hint-msg success">
        <FaCheck className="hint-icon success" />
        <span>Mật khẩu đáp ứng đầy đủ yêu cầu bảo mật</span>
      </div>
    );
  }

  const missingRules = rules.filter((r) => !r.met).map((r) => r.label);
  return (
    <div className="password-hint-msg error">
      <FaTimes className="hint-icon error" />
      <span>Chưa đạt: {missingRules.join(', ')}</span>
    </div>
  );
};

export default PasswordPolicyChecklist;

