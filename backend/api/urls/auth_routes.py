from django.urls import path
from api.views.auth_views import createUser, getProfile, updateProfile, loginUser, googleLogin, createProfile

urlpatterns = [
    path("createUser/", createUser),
    path("user/", getProfile),
    path("updateProfile/", updateProfile),
    path("loginUser/", loginUser),
    path("googleLogin/", googleLogin),
    path("createProfile/", createProfile),
]