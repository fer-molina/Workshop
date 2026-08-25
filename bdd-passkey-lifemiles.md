# BDD - Autenticación Passwordless con Passkey en LifeMiles

## Feature: Selección del método de autenticación

Como usuario del ecosistema LifeMiles
Quiero ver Passkey como opción de autenticación en la pantalla de login
Para poder elegir un método de inicio de sesión sin contraseña

### Scenario: Visualización de la opción Passkey en el login

```gherkin
Feature: Selección del método de autenticación

  Scenario: El usuario visualiza Passkey como opción de login
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    When la página de login se carga completamente
    Then debe visualizar la opción "Iniciar sesión con Passkey" junto a las opciones de usuario/contraseña y redes sociales

  Scenario: Las opciones de autenticación existentes permanecen sin cambios
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    When la página de login se carga completamente
    Then debe visualizar la opción de inicio de sesión con usuario y contraseña
    And debe visualizar la opción de inicio de sesión con Google
    And debe visualizar la opción de inicio de sesión con Apple
    And debe visualizar la opción de inicio de sesión con Passkey

  Scenario: La opción Passkey solo se muestra en dispositivos compatibles
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    And el navegador del usuario no soporta WebAuthn
    When la página de login se carga completamente
    Then no debe visualizar la opción "Iniciar sesión con Passkey"
    And debe visualizar las opciones de usuario/contraseña y redes sociales normalmente
```

---

## Feature: Registro de Passkey (Enrolamiento)

Como usuario autenticado de LifeMiles
Quiero registrar una Passkey asociada a mi cuenta
Para poder autenticarme en el futuro sin necesidad de contraseña

### Scenario: Registro exitoso de Passkey

```gherkin
Feature: Registro de Passkey

  Background:
    Given el usuario tiene una cuenta activa en LifeMiles
    And el usuario ha iniciado sesión con un método válido (usuario/contraseña o red social)
    And el dispositivo del usuario soporta WebAuthn/FIDO2

  Scenario: El usuario registra una Passkey exitosamente
    Given el usuario accede a la sección de seguridad o configuración de su cuenta
    When selecciona la opción "Registrar Passkey"
    And el sistema solicita verificación del dispositivo
    And el usuario completa la verificación local (biometría, PIN o llave de seguridad)
    Then el sistema genera un par de llaves pública/privada
    And la llave pública se almacena en Keycloak asociada a la cuenta del usuario
    And la llave privada se almacena de forma segura en el dispositivo del usuario
    And el sistema muestra un mensaje de confirmación "Passkey registrada exitosamente"

  Scenario: El usuario cancela el registro de Passkey durante la verificación del dispositivo
    Given el usuario accede a la sección de seguridad de su cuenta
    When selecciona la opción "Registrar Passkey"
    And el sistema solicita verificación del dispositivo
    And el usuario cancela la verificación local
    Then el sistema no registra ninguna Passkey
    And el sistema muestra un mensaje "Registro de Passkey cancelado"
    And el usuario permanece en la sección de seguridad

  Scenario: El registro de Passkey falla por timeout del dispositivo
    Given el usuario accede a la sección de seguridad de su cuenta
    When selecciona la opción "Registrar Passkey"
    And el sistema solicita verificación del dispositivo
    And el usuario no completa la verificación en el tiempo permitido
    Then el sistema no registra ninguna Passkey
    And el sistema muestra un mensaje de error "Tiempo de espera agotado. Intente nuevamente"

  Scenario: El usuario intenta registrar una Passkey en un dispositivo no compatible
    Given el usuario accede a la sección de seguridad de su cuenta
    And el dispositivo no soporta WebAuthn/FIDO2
    When intenta seleccionar la opción "Registrar Passkey"
    Then el sistema muestra un mensaje "Su dispositivo no es compatible con Passkey"
    And ofrece información sobre dispositivos compatibles

  Scenario: El usuario registra múltiples Passkeys en diferentes dispositivos
    Given el usuario ya tiene una Passkey registrada en su dispositivo móvil
    When accede a la sección de seguridad desde otro dispositivo compatible
    And selecciona "Registrar Passkey"
    And completa la verificación local del nuevo dispositivo
    Then el sistema registra la nueva Passkey adicional
    And ambas Passkeys son válidas para la autenticación
    And el usuario puede visualizar la lista de Passkeys registradas
```

---

## Feature: Autenticación sin contraseña (Login con Passkey)

Como usuario de LifeMiles con una Passkey registrada
Quiero autenticarme usando solo la verificación local de mi dispositivo
Para iniciar sesión de forma rápida y segura sin ingresar contraseña

### Scenario: Autenticación exitosa con Passkey

```gherkin
Feature: Autenticación sin contraseña con Passkey

  Background:
    Given el usuario tiene una cuenta activa en LifeMiles
    And el usuario tiene al menos una Passkey registrada

  Scenario: El usuario se autentica exitosamente con Passkey
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    When selecciona la opción "Iniciar sesión con Passkey"
    And el sistema solicita verificación del dispositivo
    And el usuario completa la verificación local (biometría, PIN o llave de seguridad)
    Then el sistema valida la firma criptográfica contra la llave pública almacenada en Keycloak
    And el usuario es autenticado exitosamente
    And es redirigido a la página principal de LifeMiles
    And se genera un token de sesión válido

  Scenario: El usuario falla la verificación local del dispositivo
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    When selecciona la opción "Iniciar sesión con Passkey"
    And el sistema solicita verificación del dispositivo
    And el usuario falla la verificación local (biometría no reconocida, PIN incorrecto)
    Then el sistema no autentica al usuario
    And muestra un mensaje "Verificación fallida. Intente de nuevo o use otro método de inicio de sesión"
    And el usuario puede reintentar o seleccionar otro método de autenticación

  Scenario: El usuario intenta autenticarse con Passkey desde un dispositivo sin Passkey registrada
    Given el usuario accede a la página de inicio de sesión de LifeMiles desde un dispositivo nuevo
    And no tiene una Passkey registrada en ese dispositivo
    When selecciona la opción "Iniciar sesión con Passkey"
    Then el sistema intenta iniciar el flujo de autenticación WebAuthn
    And el dispositivo no encuentra credenciales disponibles
    And el sistema muestra un mensaje "No se encontró una Passkey en este dispositivo"
    And ofrece opciones alternativas de inicio de sesión

  Scenario: Autenticación con Passkey requiere ingresar username antes de la verificación
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    And el dispositivo tiene una Passkey registrada
    When selecciona la opción "Iniciar sesión con Passkey"
    Then el sistema solicita al usuario ingresar su email o username
    When el usuario ingresa su email registrado
    And el sistema envía el challenge con las credenciales permitidas para ese usuario
    And el dispositivo solicita verificación local (biometría, PIN o llave de seguridad)
    And el usuario completa la verificación local
    Then el sistema valida la firma criptográfica contra la llave pública del usuario en Keycloak
    And el usuario es autenticado exitosamente

  Scenario: El usuario ingresa un username sin Passkey registrada
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    When selecciona la opción "Iniciar sesión con Passkey"
    And ingresa un email que no tiene Passkey asociada
    Then el sistema muestra un mensaje "No se encontró una Passkey asociada a esta cuenta"
    And ofrece opciones alternativas de inicio de sesión (usuario/contraseña o redes sociales)

  Scenario: Timeout durante la autenticación con Passkey
    Given el usuario accede a la página de inicio de sesión de LifeMiles
    When selecciona la opción "Iniciar sesión con Passkey"
    And el sistema solicita verificación del dispositivo
    And el usuario no responde dentro del tiempo permitido
    Then el sistema cancela el intento de autenticación
    And muestra un mensaje "Tiempo de espera agotado"
    And el usuario puede reintentar o seleccionar otro método
```

---

## Feature: Convivencia con métodos de autenticación existentes

Como usuario de LifeMiles
Quiero poder elegir entre Passkey, usuario/contraseña y redes sociales
Para tener flexibilidad en cómo inicio sesión según mi preferencia o disponibilidad

### Scenario: Convivencia de métodos

```gherkin
Feature: Convivencia con métodos de autenticación existentes

  Scenario: El usuario puede alternar entre métodos de autenticación sin conflictos
    Given el usuario tiene una cuenta con Passkey registrada y contraseña activa
    When accede a la página de inicio de sesión
    Then puede elegir autenticarse con Passkey
    Or puede elegir autenticarse con usuario y contraseña
    Or puede elegir autenticarse con Google
    Or puede elegir autenticarse con Apple

  Scenario: El registro de Passkey no invalida la contraseña existente
    Given el usuario tiene una cuenta con contraseña activa
    When registra una Passkey exitosamente
    Then la contraseña sigue siendo válida para autenticación
    And el usuario puede seguir usando usuario/contraseña para iniciar sesión

  Scenario: El usuario sin Passkey no se ve afectado
    Given el usuario tiene una cuenta sin Passkey registrada
    When accede a la página de inicio de sesión
    Then puede autenticarse con usuario y contraseña normalmente
    And puede autenticarse con Google o Apple normalmente
    And la existencia de la opción Passkey no interfiere con su flujo habitual

  Scenario: Keycloak gestiona todos los métodos de autenticación de forma unificada
    Given Keycloak tiene configurados los flujos de autenticación: credenciales, redes sociales y Passkey
    When un usuario inicia sesión con cualquiera de los métodos
    Then Keycloak emite el mismo tipo de token de sesión independientemente del método usado
    And la sesión tiene los mismos permisos y duración sin importar el método de autenticación

  Scenario: Fallback a otros métodos cuando Passkey no está disponible
    Given el usuario tiene Passkey registrada pero accede desde un dispositivo sin soporte WebAuthn
    When accede a la página de inicio de sesión
    Then la opción de Passkey no se muestra
    And el usuario puede autenticarse con usuario/contraseña o redes sociales sin inconvenientes
```

---

## Feature: Seguridad reforzada con Passkey

Como equipo de seguridad de LifeMiles
Quiero que la autenticación con Passkey cumpla estándares de seguridad FIDO2
Para reducir la superficie de ataque asociada a contraseñas

### Scenario: Seguridad del flujo Passkey

```gherkin
Feature: Seguridad reforzada con Passkey

  Scenario: La Passkey es resistente a ataques de phishing
    Given un atacante crea una página de login falsa que imita a LifeMiles
    When un usuario con Passkey accede a la página falsa
    And intenta autenticarse con Passkey
    Then el navegador verifica que el origin del sitio no coincide con el registrado
    And la autenticación no se completa
    And la llave privada nunca se expone al sitio falso

  Scenario: La llave privada nunca sale del dispositivo del usuario
    Given el usuario se autentica con Passkey
    When el dispositivo firma el challenge del servidor
    Then solo la firma digital se envía al servidor
    And la llave privada permanece almacenada localmente en el dispositivo
    And el servidor solo almacena la llave pública

  Scenario: Protección contra credential stuffing
    Given un atacante tiene credenciales robadas de otro sitio
    When intenta usar esas credenciales en LifeMiles
    Then las credenciales de Passkey no son reutilizables entre sitios
    And cada Passkey es única para el dominio de LifeMiles
    And el ataque no compromete cuentas que usen Passkey

  Scenario: Revocación de Passkey comprometida
    Given el usuario sospecha que su dispositivo fue comprometido
    When accede a la configuración de seguridad de su cuenta (usando otro método de autenticación)
    And selecciona la Passkey asociada al dispositivo comprometido
    And confirma la revocación de esa Passkey
    Then la llave pública es eliminada de Keycloak
    And la Passkey revocada no puede usarse para autenticación futura
    And las demás Passkeys del usuario siguen funcionando

  Scenario: Verificación de attestation durante el registro
    Given el usuario inicia el registro de una Passkey
    When el dispositivo genera el par de llaves y la attestation
    Then Keycloak valida la attestation según la política configurada
    And verifica que el authenticator cumple los requisitos mínimos de seguridad
    And rechaza registros de authenticators no confiables si la política lo exige
```

---

## Feature: Gestión de Passkeys del usuario

Como usuario de LifeMiles
Quiero administrar mis Passkeys registradas
Para tener control sobre mis métodos de autenticación

### Scenario: Gestión de Passkeys

```gherkin
Feature: Gestión de Passkeys del usuario

  Scenario: El usuario visualiza sus Passkeys registradas
    Given el usuario ha iniciado sesión en LifeMiles
    And tiene Passkeys registradas
    When accede a la sección de seguridad de su cuenta
    Then puede ver la lista de Passkeys registradas
    And cada Passkey muestra información identificativa (nombre del dispositivo, fecha de registro, último uso)

  Scenario: El usuario elimina una Passkey registrada
    Given el usuario ha iniciado sesión en LifeMiles
    And tiene al menos una Passkey registrada
    When accede a la gestión de Passkeys
    And selecciona eliminar una Passkey específica
    And confirma la eliminación
    Then la Passkey es eliminada de Keycloak
    And la Passkey eliminada no puede usarse para futuros inicios de sesión
    And el usuario recibe confirmación de la eliminación

  Scenario: El usuario renombra una Passkey para identificarla fácilmente
    Given el usuario tiene múltiples Passkeys registradas
    When accede a la gestión de Passkeys
    And edita el nombre de una Passkey (ejemplo: "iPhone personal", "Laptop trabajo")
    Then el nombre se actualiza correctamente
    And se muestra el nuevo nombre en la lista de Passkeys
```

---

## Feature: Configuración de Keycloak para Passkey

Como administrador del sistema
Quiero que Keycloak esté configurado correctamente para soportar Passkey/WebAuthn
Para garantizar el correcto funcionamiento del flujo de autenticación passwordless

### Scenario: Configuración del servidor

```gherkin
Feature: Configuración de Keycloak para Passkey

  Scenario: Keycloak tiene habilitado el autenticador WebAuthn Passwordless
    Given el administrador accede a la configuración de Keycloak
    When revisa el flujo de autenticación del realm de LifeMiles
    Then el autenticador "WebAuthn Passwordless Authenticator" está registrado y activo
    And está configurado como alternativa dentro del flujo de browser login

  Scenario: La política de WebAuthn está configurada correctamente
    Given el administrador accede a la configuración WebAuthn Passwordless de Keycloak
    Then el Relying Party (RP) name está configurado como "LifeMiles"
    And el RP ID corresponde al dominio de LifeMiles
    And la attestation conveyance está configurada según la política de seguridad
    And el user verification requirement está establecido en "required"
    And el resident key requirement está configurado como "required" (para discoverable credentials)

  Scenario: El flujo de autenticación permite selección de método
    Given Keycloak tiene configurado el flujo de browser login
    When un usuario accede al login
    Then el flujo presenta las opciones: credenciales, redes sociales y Passkey
    And cada opción es un execution de tipo ALTERNATIVE dentro del flujo
    And el usuario puede seleccionar cualquiera sin restricciones

  Scenario: El tema de login muestra correctamente la opción Passkey
    Given Keycloak tiene configurado un tema personalizado para LifeMiles
    When se renderiza la página de login
    Then el tema incluye el botón/enlace para autenticación con Passkey
    And el diseño es consistente con la identidad visual de LifeMiles
    And la opción Passkey es responsive y accesible (WCAG 2.1 AA)
```

---

## Requerimientos No Funcionales (Escenarios BDD)

```gherkin
Feature: Requerimientos no funcionales de Passkey

  Scenario: Rendimiento - El flujo de autenticación con Passkey responde en tiempo aceptable
    Given el usuario inicia autenticación con Passkey
    When completa la verificación local del dispositivo
    Then la validación del servidor (Keycloak) responde en menos de 2 segundos
    And el usuario es redirigido en menos de 3 segundos totales

  Scenario: Compatibilidad - Soporte en navegadores principales
    Given la funcionalidad de Passkey está desplegada
    Then debe funcionar en Chrome 67+
    And debe funcionar en Safari 14+
    And debe funcionar en Firefox 60+
    And debe funcionar en Edge 18+
    And debe funcionar en navegadores móviles de Android e iOS

  Scenario: Disponibilidad - El fallo de Passkey no afecta otros métodos
    Given el servicio de WebAuthn de Keycloak experimenta un error
    When un usuario accede a la página de login
    Then los métodos de usuario/contraseña y redes sociales siguen funcionando
    And se muestra un mensaje informativo si Passkey no está disponible temporalmente

  Scenario: Accesibilidad - La opción Passkey es accesible
    Given la página de login se renderiza
    Then el botón de Passkey tiene etiquetas ARIA apropiadas
    And es navegable por teclado
    And tiene contraste de color adecuado (ratio mínimo 4.5:1)
    And es compatible con lectores de pantalla

  Scenario: Auditoría - Los eventos de Passkey se registran
    Given un usuario realiza una acción relacionada con Passkey (registro, autenticación, eliminación)
    Then el evento se registra en los logs de Keycloak
    And incluye timestamp, tipo de acción, usuario, resultado (éxito/fallo)
    And los logs son consultables para análisis de seguridad
```

---

## Resumen de Requerimientos Mínimos

| # | Requerimiento | Feature BDD |
|---|---|---|
| 1 | Mostrar Passkey como opción de login | Selección del método de autenticación |
| 2 | Detectar compatibilidad WebAuthn del dispositivo | Selección del método de autenticación |
| 3 | Flujo de registro/enrolamiento de Passkey | Registro de Passkey |
| 4 | Soporte de múltiples Passkeys por usuario | Registro de Passkey |
| 5 | Autenticación passwordless con Passkey | Autenticación sin contraseña |
| 6 | Username requerido antes de verificación Passkey | Autenticación sin contraseña |
| 7 | Convivencia sin afectar métodos existentes | Convivencia con métodos existentes |
| 8 | Token de sesión unificado | Convivencia con métodos existentes |
| 9 | Resistencia a phishing (validación de origin) | Seguridad reforzada |
| 10 | Llave privada nunca sale del dispositivo | Seguridad reforzada |
| 11 | Revocación de Passkeys comprometidas | Seguridad reforzada |
| 12 | Panel de gestión de Passkeys del usuario | Gestión de Passkeys |
| 13 | Configuración WebAuthn Passwordless en Keycloak | Configuración de Keycloak |
| 14 | Tema personalizado con opción Passkey | Configuración de Keycloak |
| 15 | Rendimiento < 3s en flujo completo | Requerimientos no funcionales |
| 16 | Compatibilidad con navegadores principales | Requerimientos no funcionales |
| 17 | Accesibilidad WCAG 2.1 AA | Requerimientos no funcionales |
| 18 | Auditoría de eventos Passkey | Requerimientos no funcionales |
