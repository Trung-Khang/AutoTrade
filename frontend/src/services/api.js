import axios from 'axios';

// Lấy API base URL từ biến môi trường Vite (.env)
// Fallback mặc định là http://localhost:8080/api/v1 (Spring Boot Backend TV1/TV4)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: đính kèm Authorization JWT Token từ localStorage nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('autotrade_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: chuẩn hóa cấu trúc lỗi HTTP (401/403/404/409/422/500)
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.';
    const status = error.response ? error.response.status : null;

    if (error.response) {
      const data = error.response.data;

      // Ưu tiên thông điệp chi tiết từ Backend
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.error) {
        errorMessage = data.error;
      } else {
        // Chuẩn hóa theo mã HTTP Status (TV2.md Day 2 Item 4)
        switch (status) {
          case 400:
            errorMessage = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập.';
            break;
          case 401:
            errorMessage = 'Phiên đăng nhập đã hết hạn hoặc chưa xác thực (401). Vui lòng đăng nhập lại.';
            break;
          case 403:
            errorMessage = 'Truy cập bị từ chối (403): Bạn không có quyền thực hiện chức năng này.';
            break;
          case 404:
            errorMessage = 'Không tìm thấy tài nguyên yêu cầu (404).';
            break;
          case 409:
            errorMessage = 'Xung đột dữ liệu (409): Xe này vừa có khách hàng khác đặt cọc giữ chỗ trước bạn.';
            break;
          case 422:
            errorMessage = 'Dữ liệu không thể xử lý (422): Thông tin gửi lên vi phạm ràng buộc nghiệp vụ.';
            break;
          case 500:
            errorMessage = 'Lỗi nội bộ từ máy chủ Backend (500). Vui lòng thử lại sau.';
            break;
          default:
            errorMessage = `Lỗi từ máy chủ (HTTP ${status}). Vui lòng thử lại.`;
        }
      }
    } else if (error.request) {
      errorMessage = 'Không nhận được phản hồi từ Backend (Spring Boot chưa khởi động hoặc gặp sự cố mạng).';
    }

    const customError = new Error(errorMessage);
    customError.status = status;
    customError.originalError = error;
    return Promise.reject(customError);
  }
);

export default apiClient;

