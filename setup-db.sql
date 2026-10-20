-- Run once in SSMS (New Query > Execute). Change the password first!
CREATE DATABASE ForeverUs;
GO
CREATE LOGIN foreverus_app WITH PASSWORD = 'Beddel-Password-Xooggan-1!', CHECK_POLICY = OFF;
GO
USE ForeverUs;
GO
CREATE USER foreverus_app FOR LOGIN foreverus_app;
ALTER ROLE db_owner ADD MEMBER foreverus_app;
GO
