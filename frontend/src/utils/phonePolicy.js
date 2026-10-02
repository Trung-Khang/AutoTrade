const PHONE_RULE = 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09';

export const normalizeVietnamesePhone = (value = '') => {
  let compact = value.trim().replace(/[\s().-]/g, '');
  if (compact.startsWith('+84')) {
    compact = `0${compact.slice(3)}`;
  }
  return compact;
};

export const validateVietnamesePhone = (value = '') => {
  const normalized = normalizeVietnamesePhone(value);
  if (!value) {
    return { state: 'default', message: 'Nhập số điện thoại Việt Nam để đăng ký tài khoản' };
  }
  if (/^(03|05|07|08|09)\d{8}$/.test(normalized)) {
    return { state: 'success', message: 'Số điện thoại hợp lệ', normalized };
  }
  return { state: 'error', message: PHONE_RULE, normalized };
};
