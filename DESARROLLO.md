Desarrolla un sistema completo de gestión de usuarios, roles y permisos inspirado en SonarQube para una aplicación web de Evaluaciones Heurísticas.

## Contexto del proyecto

segun el proyecto.

## Requerimiento principal

Implementar un sistema RBAC (Role-Based Access Control) con permisos globales similar a SonarQube.

### Roles del sistema

Solo existen 2 roles:

1. ADMIN

* Es el primer usuario registrado en el sistema.
* Tiene control total del sistema.
* Puede crear usuarios.
* Puede editar usuarios.
* Puede activar/desactivar usuarios.
* Puede asignar roles.
* Puede asignar permisos globales.
* Puede administrar configuraciones generales.

2. EVALUADOR

* Puede acceder al dashboard.
* Puede realizar evaluaciones heurísticas.
* Puede consultar reportes según permisos asignados.

## Registro inicial

* Si no existe ningún usuario registrado, el primer usuario que se registre automáticamente debe recibir rol ADMIN.
* Los siguientes usuarios no pueden autoregistrarse como ADMIN.
* Los demás usuarios deben ser creados por un ADMIN.

Implementar lógica tipo:
if users.count == 0 => assign ADMIN

## Sistema de permisos globales

Crear permisos independientes del rol.

Lista de permisos:

* MANAGE_USERS
* CREATE_USERS
* EDIT_USERS
* DELETE_USERS
* ASSIGN_ROLES
* ASSIGN_GLOBAL_PERMISSIONS
* CREATE_EVALUATIONS
* EDIT_EVALUATIONS
* DELETE_EVALUATIONS
* VIEW_REPORTS
* MANAGE_SYSTEM

Cada usuario obtiene permisos por:

1. su rol
2. permisos directos asignados individualmente

Permisos finales:
final_permissions = role_permissions + user_permissions

## Modelo de base de datos

Diseñar tablas:

users

* id
* name
* email
* password_hash
* active
* created_at

roles

* id
* name
* description

permissions

* id
* code
* name
* description

user_roles

* id
* user_id
* role_id

role_permissions

* id
* role_id
* permission_id

user_permissions

* id
* user_id
* permission_id

## Restricciones de seguridad

Implementar validaciones:

1. No permitir eliminar al último ADMIN del sistema.
2. No permitir quitar permisos críticos al último ADMIN.
3. No permitir que un usuario se asigne permisos que no posee.
4. Validar permisos en backend, no solo frontend.

## Backend requerido

Implementar:

### Auth

* login
* logout
* register first admin
* refresh token opcional

### Middleware de autorización

Ejemplo:
authorize("MANAGE_USERS")

o decorador equivalente.

Middleware debe validar:

* JWT válido
* usuario activo
* permisos requeridos

## Endpoints sugeridos

Auth:
POST /auth/register
POST /auth/login

Users:
GET /users
POST /users
PUT /users/
PATCH /users//status
DELETE /users/

Roles:
GET /roles
POST /roles
PUT /roles/

Permissions:
GET /permissions
PUT /users//permissions
PUT /users//roles

## Frontend

Crear interfaz administrativa similar a SonarQube.

Sidebar:

* Dashboard
* Users
* Roles
* Global Permissions
* Settings

Pantalla Users:

* tabla de usuarios
* crear usuario
* editar usuario
* activar/desactivar

Pantalla Roles:

* ver roles
* asignar permisos a roles

Pantalla Global Permissions:

* seleccionar usuario
* checklist de permisos

Ejemplo UI:
[ ] MANAGE_USERS
[x] CREATE_EVALUATIONS
[x] VIEW_REPORTS

## Extras

* Código limpio y modular.
* Arquitectura escalable.
* Manejo de errores centralizado.
* Validaciones con zod o joi.
* Documentación básica de endpoints.
* Documentación en el codigo.

ademas actualiza el modelo relacional para que se pueda tener estos cambios en cuenta y actualiza el nombre de las tablas para que tengan un nombre plural.

sigue utilizando los mejores patrones de diseño y sigue con el mismo diseño actual 
todo esta implementacion se dara al darle click a la turca abajo del nombre se podra cerrar sesion (logout) o acceder al my acount donde se implementara toda esta logica, segun los roles entonces actualiza las vistas a lo que se requiere y lo que realmente deberia de ver.