//! Password hashing helpers. Credentials are stored as salted Argon2 hashes,
//! never in clear text.

use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;

/// Hash a plaintext password with a fresh 16-byte random salt.
pub fn hash_password(password: &str) -> Result<String, String> {
    let mut salt_bytes = [0u8; 16];
    getrandom::getrandom(&mut salt_bytes).map_err(|e| format!("rng error: {e}"))?;
    let salt = SaltString::encode_b64(&salt_bytes).map_err(|e| e.to_string())?;
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?;
    Ok(hash.to_string())
}

/// Verify a plaintext password against a stored Argon2 hash string.
pub fn verify_password(password: &str, stored_hash: &str) -> bool {
    match PasswordHash::new(stored_hash) {
        Ok(parsed) => Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok(),
        Err(_) => false,
    }
}
