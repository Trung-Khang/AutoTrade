const PasswordPolicyChecklist = ({ rules }) => (
  <ul className="password-policy-checklist" aria-label="Yêu cầu mật khẩu">
    {rules.map((rule) => (
      <li key={rule.id} className={rule.met ? 'met' : ''}>
        <span aria-hidden="true">{rule.met ? 'OK' : '--'}</span>
        {rule.label}
      </li>
    ))}
  </ul>
);

export default PasswordPolicyChecklist;
