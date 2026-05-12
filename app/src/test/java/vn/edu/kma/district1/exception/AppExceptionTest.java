package vn.edu.kma.district1.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class AppExceptionTest {

    @Test
    void messageIsPreserved() {
        AppException ex = assertThrows(AppException.class, () -> {
            throw new AppException("test");
        });
        assertEquals("test", ex.getMessage());
    }
}
