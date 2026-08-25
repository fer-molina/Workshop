# Configuración manual de Keycloak vía Admin Console — LifeMiles Passkey

Esta guía documenta cómo instalar Keycloak de forma **standalone (sin Docker/docker-compose)**
y cómo habilitar el autenticador **WebAuthn Passwordless** manualmente a través de la
**Consola de Administración**, para el ambiente real de desarrollo/staging.

> **Nota importante**: Esta guía es exclusivamente para el Keycloak **real** (dev/staging).
> Los tests de integración automatizados usan un realm de fixture separado
> (`src/test/resources/keycloak-test-realm.json`) levantado vía Testcontainers, que no
> depende de esta guía ni la reemplaza. Ver la nota al final de este documento.

## 1. Instalación standalone de Keycloak

1. Descargar la distribución Quarkus de Keycloak 24+ desde <https://www.keycloak.org/downloads>
   (archivo `keycloak-<version>.zip` o `.tar.gz`).
2. Descomprimir en el servidor/máquina destino, por ejemplo `/opt/keycloak`.
3. **Ambiente de desarrollo local**:
   ```
   bin/kc.sh start-dev
   ```
   Esto inicia Keycloak en modo desarrollo (HTTP habilitado, sin necesidad de configurar TLS
   localmente) escuchando en `http://localhost:8080`.
4. **Ambiente de staging/producción**:
   ```
   bin/kc.sh build
   bin/kc.sh start --optimized
   ```
   Configurar previamente las variables de entorno de Keycloak requeridas para producción
   (TLS, hostname, base de datos), según la [documentación oficial de Keycloak](https://www.keycloak.org/server/configuration).
   TLS es obligatorio en este modo (SECURITY-01: cifrado en tránsito).
5. Acceder a la consola de administración en `http://localhost:8080/admin` (dev) o la URL
   configurada para staging, y crear el usuario administrador inicial siguiendo el asistente
   de arranque (bootstrap admin). **No usar credenciales por defecto** (SECURITY-09): el
   asistente de Keycloak 26+ solicita definir usuario/password del admin en el primer arranque.

## 2. Crear/seleccionar el Realm LifeMiles

1. En la consola de administración, ir al selector de realm (esquina superior izquierda).
2. Click en **Create Realm**.
3. Nombre del realm: `lifemiles` (o el nombre que corresponda al ambiente, ej. `lifemiles-staging`).
4. Click **Create**.

## 3. Configurar la política WebAuthn Passwordless

1. Dentro del realm `lifemiles`, ir a **Authentication** (menú lateral izquierdo).
2. Seleccionar la pestaña **Policies**.
3. Seleccionar **WebAuthn Passwordless Policy** en el sub-menú.
4. Configurar los siguientes valores:
   - **Relying Party Entity Name**: `LifeMiles`
   - **Relying Party ID**: el dominio de LifeMiles (ej. `www.lifemiles.com`)
   - **Signature Algorithms**: dejar los valores por defecto recomendados (ES256 mínimo)
   - **Attestation Conveyance Preference**: según la política de seguridad definida (ej. `direct`
     o `none` — documentar la decisión tomada por el equipo de seguridad)
   - **Authenticator Attachment**: `platform` (recomendado para biometría/PIN del dispositivo)
     o dejar sin preferencia si se desea soportar llaves de seguridad externas también
   - **Require Resident Key**: `Yes` (requerido para discoverable credentials / passwordless real)
   - **User Verification Requirement**: `Required`
   - **Timeout**: valor por defecto (ej. 60 segundos) o ajustar según UX deseada
5. Click **Save**.

## 4. Agregar WebAuthn Passwordless como ALTERNATIVE en el Browser Flow

1. Ir a **Authentication → Flows**.
2. Seleccionar el flow **Browser** (o duplicarlo si se prefiere no modificar el flow por defecto,
   ej. `Browser - LifeMiles`, y luego asignarlo como binding del realm en **Bindings**).
3. Dentro del flow, localizar el paso donde se listan las alternativas de autenticación
   (mismo nivel que "Username Password Form" y los identity providers sociales).
4. Click en **Add step** dentro de esa sub-sección.
5. Seleccionar **WebAuthn Passwordless Authenticator**.
6. Click **Add**.
7. Asegurarse de que el requirement del nuevo paso esté configurado como **ALTERNATIVE**
   (no `REQUIRED`), para que coexista con usuario/contraseña y login social sin reemplazarlos.
8. Guardar los cambios (los cambios en el flow se guardan automáticamente al configurar el
   requirement de cada paso).
9. Si se duplicó el flow, ir a **Authentication → Bindings** y asignar el flow personalizado
   como **Browser Flow** del realm.

## 5. Verificación

1. Abrir la página de login del realm: `http://localhost:8080/realms/lifemiles/account` (dev)
   o la URL de login de la aplicación cliente configurada.
2. Confirmar que aparece la opción de autenticación con Passkey junto a usuario/contraseña.
3. Confirmar en **Authentication → Flows → Browser** que el paso WebAuthn Passwordless
   aparece con estado **ALTERNATIVE**.

## 6. Variables de entorno requeridas por el backend

Una vez configurado el realm, exportar las siguientes variables de entorno antes de iniciar
`passkey-service` (ver `application.yml`). **Nunca** commitear estos valores al repositorio
(SECURITY-09, SECURITY-12):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `KEYCLOAK_ISSUER_URI` | Issuer URI del realm, usado para validación de JWT | `https://keycloak.lifemiles.com/realms/lifemiles` |
| `KEYCLOAK_CLIENT_ID` | Client ID registrado en Keycloak para el backend | `passkey-service` |
| `KEYCLOAK_ADMIN_URL` | URL base del servidor Keycloak (Admin REST API) | `https://keycloak.lifemiles.com` |
| `KEYCLOAK_ADMIN_USER` | Usuario de servicio con permisos mínimos de gestión de credenciales (SECURITY-06) | *(gestionado en secrets manager)* |
| `KEYCLOAK_ADMIN_PASSWORD` | Password del usuario de servicio | *(gestionado en secrets manager)* |

**PowerShell (ejemplo local, no usar en producción)**:
```powershell
$env:KEYCLOAK_ISSUER_URI = "http://localhost:8080/realms/lifemiles"
$env:KEYCLOAK_CLIENT_ID = "passkey-service"
$env:KEYCLOAK_ADMIN_URL = "http://localhost:8080"
$env:KEYCLOAK_ADMIN_USER = "<usuario-de-servicio>"
$env:KEYCLOAK_ADMIN_PASSWORD = "<password-de-servicio>"
mvn spring-boot:run
```

## Nota sobre Testcontainers (tests automatizados)

Esta guía **no aplica** a los tests de integración automatizados. Esos tests levantan un
contenedor Keycloak efímero (vía Testcontainers) que importa el realm de fixture
`src/test/resources/keycloak-test-realm.json`, el cual ya trae el WebAuthn Passwordless
Authenticator preconfigurado como ALTERNATIVE. Ese fixture es independiente de esta guía:
no representa la configuración del Keycloak real, y no debe usarse como referencia para
configurar los ambientes reales de dev/staging. Ver `src/test/resources/README-fixture-realm.md`.
