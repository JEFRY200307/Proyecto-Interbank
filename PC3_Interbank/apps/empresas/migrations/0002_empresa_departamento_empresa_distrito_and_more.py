# Generated by Django 5.2.2 on 2025-06-14 06:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('empresas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='empresa',
            name='departamento',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='empresa',
            name='distrito',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='empresa',
            name='provincia',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
