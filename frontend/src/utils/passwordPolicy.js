const SPECIAL_CHARACTERS = '@#$%^&+=!';

export const getPasswordPolicy = (password) => {
  return [
    { id: 'min-length', label: 'Ít nhất 8 ký tự', met: password.length >= 8 },
    { id: 'uppercase', label: 'Có chữ hoa', met: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'Có chữ thường', met: /[a-z]/.test(password) },
    { id: 'digit', label: 'Có chữ số', met: /\d/.test(password) },
    { id: 'special', label: 'Có ký tự đặc biệt (@#$%^&+=!)', met: [...password].some((character) => SPECIAL_CHARACTERS.includes(character)) },
  ];
};

export const isPasswordCompliant = (password) => getPasswordPolicy(password).every((rule) => rule.met);
