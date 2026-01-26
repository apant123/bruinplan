from django.urls import path
from api.views.auth_views import createUser, getProfile, updateProfile

urlpatterns = [
    path("createUser/", createUser),
    path("user/", getProfile),
    path("updateProfile/", updateProfile)

]