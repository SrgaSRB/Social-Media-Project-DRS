class Config:
    SECRET_KEY = "your-secret-key"
    SESSION_TYPE = 'filesystem'
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True

    UPLOAD_FOLDER = "./uploads"
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

    # Cloudinary podaci (nemoj direktno u kod u realnim aplikacijama)
    CLOUDINARY_CLOUD_NAME = "dloemc8rb"
    CLOUDINARY_API_KEY = "473783831832757"
    CLOUDINARY_API_SECRET = "qqhfhL8l2FEjkkG4lBJGhbov63o"
