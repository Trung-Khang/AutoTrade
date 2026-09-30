// Standalone local tool. No backend dependency changes. Never prints plaintext.
import java.util.Arrays;
import java.security.SecureRandom;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class DemoBcrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String password;
        if (args.length == 1 && args[0].equals("--verify-fixture")) {
            byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes);
            password = java.util.Base64.getEncoder().encodeToString(bytes);
            Arrays.fill(bytes, (byte)0);
            String hash = encoder.encode(password);
            if (!encoder.matches(password,hash) || encoder.matches(password+"x",hash) || !hash.startsWith("$2a$12$"))
                throw new IllegalStateException("BCrypt compatibility failure");
            System.out.print(hash); // Runner keeps in memory, never in evidence.
            return;
        }
        if (args.length == 1 && args[0].equals("--operator-env")) {
            password = System.getenv("AUTOTRADE_PRIVATE_DEMO_PASSWORD");
            if (password == null || password.isEmpty()) throw new IllegalArgumentException("Private credential required");
        } else {
            if (System.console() == null) throw new IllegalStateException("Run in an interactive terminal for private credential input");
            char[] input = System.console().readPassword("Private local demo password: ");
            if (input == null || input.length == 0) throw new IllegalArgumentException("Nonempty credential required");
            password = new String(input); Arrays.fill(input,'\0');
        }
        String existing = System.getenv("AUTOTRADE_DEMO_BCRYPT_HASH");
        String hash = existing == null || existing.isBlank() ? encoder.encode(password) : existing;
        if (!encoder.matches(password,hash) || !hash.matches("\\$2[aby]\\$12\\$[./A-Za-z0-9]{53}"))
            throw new IllegalStateException("Credential/hash mismatch or non-cost-12 hash");
        System.out.print(hash);
    }
}
