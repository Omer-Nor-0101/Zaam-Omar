-- Optional: the server creates these automatically on start. Run manually only if you prefer.
-- CREATE DATABASE ForeverUs;  GO  USE ForeverUs;  GO

IF OBJECT_ID('dbo.Users') IS NULL
CREATE TABLE dbo.Users (
  Id           INT IDENTITY(1,1) PRIMARY KEY,
  AccountKey   NVARCHAR(220) NOT NULL UNIQUE,   -- email, or '@username'
  Name         NVARCHAR(50)  NOT NULL,
  Username     NVARCHAR(30)  NULL,
  Email        NVARCHAR(200) NULL,
  PasswordHash NVARCHAR(100) NOT NULL,          -- bcrypt
  Created      DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_Users_Username')
  CREATE UNIQUE INDEX UX_Users_Username ON dbo.Users(Username) WHERE Username IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_Users_Email')
  CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email) WHERE Email IS NOT NULL;

IF OBJECT_ID('dbo.AppData') IS NULL
CREATE TABLE dbo.AppData (
  [Key]     NVARCHAR(100) NOT NULL PRIMARY KEY,  -- e.g. forever-us-photos-v2
  [Value]   NVARCHAR(MAX) NOT NULL,              -- the JSON the page saves
  UpdatedAt DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedBy INT NULL REFERENCES dbo.Users(Id)
);
