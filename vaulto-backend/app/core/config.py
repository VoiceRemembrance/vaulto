from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Vaulto API"
    secret_key: str = "replace-this-with-a-long-random-secret"
    access_token_expire_minutes: int = 60 * 24 * 7
    database_url: str = "sqlite:///./vaulto.db"
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
