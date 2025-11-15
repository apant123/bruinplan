from django.db import models

class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.TextField(null=True)
    password_hash = models.TextField(null=True)

    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    auth_provider = models.TextField(null=True)  # store string ('google', 'password')

    class Meta:
        db_table = "users"      # EXACT Supabase table name
        managed = False         # Django won't create/migrate this table
