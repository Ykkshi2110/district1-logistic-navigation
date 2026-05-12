package vn.edu.kma.district1.exception;

/**
 * Lỗi nghiệp vụ / đầu vào không hợp lệ của ứng dụng.
 */
public class AppException extends RuntimeException {

    public AppException(String message) {
        super(message);
    }
}
