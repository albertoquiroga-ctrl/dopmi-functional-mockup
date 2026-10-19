# DopMi — Fuente de la Verdad Funcional

**Versión:** 1.0  
**Fecha:** 8 de agosto de 2026  
**Objetivo principal:** servir como contexto funcional para Cursor al implementar un prototipo de DopMi usando las pantallas de Figma disponibles mediante MCP.

---

## 0. Cómo debe usar Cursor este documento

Este documento define **qué hace DopMi, qué significa cada pantalla, cómo se conectan los flujos, qué estados existen y qué reglas deben respetarse**. Figma define principalmente la **apariencia visual**; este documento define principalmente el **comportamiento funcional**.

### 0.1 Jerarquía de fuentes

Cuando Cursor encuentre información contradictoria, usar esta prioridad:

1. **Este documento para lógica funcional y reglas de negocio.**
2. **El frame más reciente de Figma para UI, layout, estilos, copy visible y componentes.**
3. Frames antiguos de Figma únicamente como referencia si no contradicen este documento.

Regla práctica:

- Si la contradicción es de **comportamiento, flujo, estado, permiso, datos o regla**, gana este documento.
- Si la contradicción es puramente **visual**, gana Figma.
- Si Figma muestra una pantalla antigua con una función que este documento marca como reemplazada, **no implementar la función antigua**.
- Si existe una pantalla en Figma que este documento no describe, conservarla visualmente y conectarla de forma prudente, pero **no inventar reglas de negocio nuevas**.

### 0.2 Naturaleza del prototipo

El objetivo inicial es un **prototipo navegable y creíble**, no una implementación productiva con backend real.

Por lo tanto:

- Usar datos mock persistentes durante la sesión.
- Las acciones deben cambiar estados de forma visible.
- Botones, tabs, filtros, cards, modales, formularios y navegación deben funcionar.
- Los formularios deben conservar datos al regresar al paso anterior.
- Los estados simulados deben poder recorrerse sin servicios externos reales.
- Pagos, carga de documentos, conexión de redes sociales, compra externa y validaciones de DopMi pueden simularse.
- Evitar botones muertos salvo elementos explícitamente decorativos.

### 0.3 Regla de fidelidad

Cursor no debe reconstruir DopMi como una app genérica de rescate animal. Debe **respetar los conceptos, nomenclatura, jerarquías, estados y patrones existentes en Figma**.

---

# 1. Qué es DopMi

DopMi es una plataforma enfocada en ayudar a mascotas rescatadas mediante tres acciones principales:

1. **Adoptar** mascotas que están listas para encontrar hogar.
2. **Donar** a necesidades concretas de casos de rescate.
3. **Rescatar/publicar** casos por parte de personas o asociaciones rescatistas.

La propuesta de valor se apoya en tres ideas:

- **Seguro:** procesos verificados de punta a punta cuando existe dinero de por medio.
- **Simple:** información ordenada y actualizada en lugar del caos típico de publicaciones dispersas en redes sociales.
- **Transparente:** el donante puede entender qué necesita una mascota, cuánto falta y qué ocurrió con su aportación.

Principio central de confianza: antes de apoyar un caso debe quedar claro **quién publica, qué necesita la mascota, cuánto falta y qué seguimiento/evidencia existe**.

---

# 2. Tipos de usuario

## 2.1 Donante

Persona que utiliza DopMi principalmente para:

- descubrir casos de donación;
- donar a necesidades específicas;
- seguir el avance de casos apoyados;
- guardar mascotas y rescatistas;
- explorar mascotas en adopción;
- contactar rescatistas;
- gestionar aportaciones recurrentes/apadrinamientos cuando aplique;
- convertirse en **Guardián** mediante una suscripción mensual;
- consultar su impacto e historial de donaciones.

## 2.2 Rescatista

Persona, refugio o asociación que utiliza DopMi para:

- verificar su identidad/cuenta;
- crear casos;
- solicitar donaciones para necesidades específicas;
- publicar mascotas en adopción;
- administrar sus casos;
- recibir fondos cuando corresponda;
- comprar necesidades externas cuando corresponda;
- subir evidencia;
- solicitar reembolsos;
- volver a activar necesidades recurrentes de comida;
- responder mensajes de personas interesadas o donantes;
- cerrar casos.

## 2.3 Usuario interno / administrador

Existe como superficie secundaria del producto para revisión y operación. Sus funciones se describen en el apéndice de administración. No mezclar componentes o permisos de admin con la experiencia de donante/rescatista.

---

# 3. Arquitectura general de acceso

## 3.1 Orden inicial vigente

El orden conceptual vigente para una persona nueva es:

1. **Elegir tipo de cuenta / intención principal.**
2. **Ver onboarding contextual según el tipo elegido.**
3. **Entrar a autenticación**: iniciar sesión o crear cuenta.
4. Entrar al producto con el rol seleccionado.

Esto reemplaza versiones antiguas donde el login aparecía antes del onboarding.

## 3.2 Tipos de cuenta iniciales

Como mínimo:

- Donante.
- Rescatista.

La UI exacta y nombres visibles deben seguir Figma.

## 3.3 Login

Debe contemplar:

- correo;
- contraseña;
- inicio con Google;
- inicio con Apple;
- recuperación de contraseña.

## 3.4 Crear cuenta

Debe contemplar como base:

- nombre;
- correo;
- teléfono;
- contraseña;
- confirmación de contraseña;
- Google;
- Apple;
- check obligatorio para aceptar **Términos y Condiciones**.

El usuario debe poder abrir el contenido de Términos y Condiciones desde ese flujo.

## 3.5 Onboarding

El onboarding debe explicar DopMi de acuerdo con el rol.

### Donante

Explicar de forma visual y breve:

- donar a casos reales;
- adoptar;
- seguir el impacto de las aportaciones;
- confianza/transparencia del proceso.

### Rescatista

Explicar:

- publicar casos;
- recibir apoyo para necesidades;
- publicar adopciones;
- administrar evidencia y seguimiento.

El amarillo de DopMi es el acento principal en onboarding, login y signup, siguiendo el sistema visual de Figma.

---

# 4. Principios de navegación y comportamiento global

## 4.1 Navegación

La posición exacta de tabs, bottom navigation, header y menú debe seguir los frames de Figma. Funcionalmente deben existir accesos claros a las áreas descritas en este documento.

## 4.2 Botón de notificaciones

El usuario debe tener acceso a una pantalla/lista de notificaciones desde un botón de notificaciones, ubicado en la zona superior según el patrón visual de Figma.

Ejemplos de notificaciones:

- mensaje nuevo de un rescatista/donante;
- donación enviada exitosamente;
- actualización de un caso apoyado;
- evidencia nueva;
- cambio de estado de una publicación;
- resultado de una verificación;
- actualización relevante de Guardián.

## 4.3 Guardados

Guardar y dejar de guardar es una acción reversible. Debe reflejarse de forma consistente en:

- cards;
- detalle del caso/mascota;
- pantalla de guardados.

## 4.4 Compartir

El detalle de un caso puede compartirse. El perfil público de un rescatista también puede compartirse.

## 4.5 Reportar

Debe existir opción **Reportar**:

- en el detalle de un caso, debajo del bloque de necesidades y antes de actividad;
- en el perfil público del rescatista, cerca de las tabs de Casos/Actividad según Figma.

---

# 5. Modelo conceptual de datos

Esta sección no obliga a una arquitectura técnica específica; sirve para que Cursor mantenga consistencia entre pantallas.

## 5.1 User

Campos conceptuales:

- id;
- role: donor | rescuer | internal;
- name;
- email;
- phone;
- avatar;
- accountStatus;
- notificationCount.

## 5.2 RescuerProfile

- userId;
- displayName / shelterName;
- location;
- bio;
- socialLinks;
- verificationStatus;
- verificationCorrections[];
- clabe;
- publishedCases[];
- activity[];
- counts de casos abiertos/cerrados si el diseño los muestra.

## 5.3 Case

- id;
- rescuerId;
- title;
- petName;
- story;
- photos[];
- species: dog | cat | other;
- sex: male | female;
- age;
- breed;
- size;
- location;
- publicationMode: adoption_and_donations | donations_only;
- adoptionInfo;
- needs[];
- status;
- reviewFeedback[];
- urgentFlag derivado de necesidades urgentes;
- createdAt;
- updatedAt;
- closedReason;
- farewellVideo opcional.

## 5.4 AdoptionInfo

Como mínimo:

### Salud

- vacunado;
- esterilizado;
- cuidados especiales.

### Social

- convive con perros;
- convive con gatos;
- convive con niños.

La información debe mostrarse también en el detalle visible para donantes/personas interesadas.

## 5.5 Need

- id;
- caseId;
- type: veterinary | medicine | food | other;
- title/description;
- requestedAmount;
- fundedAmount;
- urgent;
- urgentEvidence;
- fulfillmentMode;
- status;
- recurring;
- recurrenceFrequency;
- foodCatalogItem;
- quantity/numberOfOccurrences cuando corresponda;
- reimbursementData cuando corresponda.

## 5.6 Donation

- id;
- donorId;
- caseId;
- needId;
- amount;
- status;
- paymentDate;
- impactUpdates[].

## 5.7 Sponsorship / aportación recurrente a mascota

- id;
- donorId;
- caseId;
- selectedNeeds[];
- amount;
- frequency;
- active;
- createdAt;
- updatedAt.

## 5.8 Evidence

- id;
- caseId;
- needId;
- evidenceType;
- ticket/receipt;
- purchaseId cuando aplique;
- photos[];
- video;
- description;
- status;
- reviewerFeedback[].

## 5.9 GuardianSubscription

- donorId;
- amount;
- customAmount opcional;
- status;
- startedAt;
- billing settings;
- supportedCases[];
- impactReports[].

## 5.10 ChatThread

- id;
- participants[];
- relatedCaseId opcional;
- messages[];
- unreadCount.

## 5.11 Notification

- id;
- userId;
- type;
- title;
- body;
- read;
- targetScreen;
- createdAt.

---

# 6. Estados principales

## 6.1 Estado de verificación de rescatista

Estados funcionales:

- **Sin verificación**: todavía no ha enviado datos o se simuló un reinicio completo.
- **En revisión**: información enviada y pendiente de decisión.
- **Verificado**: puede operar normalmente.
- **Con errores / Rechazado**: la revisión devolvió correcciones necesarias.

Regla importante: **“Simular sin verificación” debe regresar realmente a Sin verificación**, no a Pendiente. El rescatista debe volver a llenar/enviar información para iniciar una nueva revisión.

## 6.2 Estado de caso

Los nombres visuales exactos deben seguir Figma, pero la lógica debe permitir al menos:

- Borrador;
- En revisión;
- Activo/publicado;
- Rechazado / requiere correcciones;
- Cerrado / completado.

Un caso puede además mostrarse como:

- con adopción activa;
- con donaciones activas;
- con ambas;
- con necesidad urgente.

## 6.3 Estado de evidencia / liberación de fondos

El flujo conceptual debe soportar:

1. Evidencia en borrador.
2. Evidencia enviada / en revisión.
3. Fondos liberados o proceso validado.
4. Evidencia publicada.
5. Donantes notificados.

Los labels exactos pueden variar en Figma, pero Cursor debe preservar esta progresión.

## 6.4 Estado de una necesidad

Como mínimo:

- Activa / fondeándose;
- Fondeada;
- En proceso de uso/compra;
- Evidencia pendiente;
- Evidencia en revisión;
- Completada;
- Reactivable, para comida recurrente.

---

# 7. Experiencia del DONANTE

# 7.1 Home del donante

El home debe presentar un resumen accionable, no convertirse en un dashboard administrativo.

Elementos conceptuales que pueden aparecer según Figma:

- casos relevantes o urgentes;
- acceso a explorar donaciones;
- acceso a adopciones;
- card de **Tu impacto**;
- acceso a notificaciones;
- contenido relacionado con mascotas o rescatistas seguidos.

## Card “Tu impacto”

Debe existir un icono de información. Al activarlo se explica cómo se calcula el impacto y se muestra un desglose equivalente al modal de **Impacto total** del perfil del donante.

La card es informativa y sirve como puerta de entrada a la experiencia de impacto/Guardián.

---

# 7.2 Explorar casos de donación

Debe existir una vista/listado de casos.

Cada card debe permitir entender rápidamente:

- mascota;
- rescatista;
- necesidad principal o categoría;
- monto recaudado / meta;
- estado;
- si es urgente;
- última actualización cuando Figma la contemple.

El estado **Urgente** debe visualizarse como tag/badge cuando corresponda.

Acciones habituales:

- abrir detalle;
- guardar;
- compartir cuando esté contemplado.

---

# 7.3 Detalle de caso — Donante

Este es uno de los nodos principales del producto.

Debe mostrar:

- fotografías;
- nombre/título;
- historia;
- datos de la mascota;
- rescatista responsable;
- ubicación;
- necesidades;
- progreso económico;
- actualizaciones/actividad/evidencias;
- estado del caso;
- opción de guardar;
- opción de compartir;
- opción de reportar.

## Necesidades

Cada necesidad debe mostrarse de manera independiente y permitir entender:

- tipo;
- objetivo;
- monto recaudado;
- cuánto falta;
- estado;
- urgencia, si aplica.

El CTA **Donar** vive asociado a la necesidad correspondiente, no como una acción ambigua sin contexto.

## Perfil del rescatista

Desde el caso se puede abrir el perfil público del rescatista.

---

# 7.4 Donar a una necesidad

Flujo conceptual:

1. Usuario abre un caso.
2. Elige una necesidad.
3. Pulsa **Donar**.
4. Selecciona/ingresa la aportación siguiendo el componente de Figma.
5. Revisa el pago.
6. Confirma.
7. El sistema simula resultado exitoso o error.
8. En éxito:
   - actualizar monto recaudado;
   - registrar la aportación en historial;
   - mostrar confirmación;
   - generar notificación correspondiente.

No inventar campos financieros que no aparezcan en Figma.

---

# 7.5 Error de pago

Existe una pantalla de prototipo cuyo nombre debe ser reconocible como:

**Payment Error**

Copy/estado principal: **“Pago no completado”**.

Debe permitir como mínimo:

- entender que la operación no se realizó;
- volver a intentar;
- regresar sin registrar una donación falsa.

El pago fallido no debe incrementar el monto del caso ni aparecer como donación exitosa.

---

# 7.6 Historial de donaciones

Debe existir una pantalla independiente:

**Donation History / Historial de donaciones**.

El perfil o Donation Log puede mostrar una versión resumida con **“Ver más”** que abre el historial completo.

Comportamiento esperado:

- lista cronológica;
- scroll continuo/infinito para prototipo;
- cada registro identifica caso/mascota, necesidad, monto y fecha;
- un registro puede llevar de vuelta al caso relacionado.

---

# 7.7 Apadrinamientos / aportaciones recurrentes a una mascota

Si Figma conserva la experiencia de **Mascotas apadrinadas**, usar esta lógica:

- seleccionar una mascota/caso para aportar de manera recurrente;
- seleccionar necesidades;
- definir monto y frecuencia;
- mostrar resumen antes de confirmar.

En una mascota ya apadrinada, el CTA cambia de **Sponsor/Apadrinar** a **Editar sponsor** o equivalente visual actual.

El modal/pantalla de edición debe precargar:

- necesidades seleccionadas;
- monto;
- frecuencia;
- resumen.

Acciones:

- guardar cambios;
- cancelar aportación recurrente actual.

Si un caso cambia de necesidades y eso afecta un apadrinamiento activo, la UI debe señalarlo y requerir confirmación/ajuste en lugar de modificar silenciosamente el compromiso del donante.

---

# 7.8 Adopción

Debe existir una superficie **En adopción** separada de la exploración de donaciones, aunque una misma mascota pueda estar publicada para ambas cosas.

## Filtros mínimos conocidos

- sexo: Macho / Hembra;
- tipo: Gato / Perro.

Si Figma ya incluye filtros adicionales, conservarlos.

## Card de adopción

Debe permitir:

- abrir detalle;
- guardar mascota.

## Detalle de adopción

Debe mostrar la información general de la mascota y, de forma visible:

### Salud

- vacunado;
- esterilizado;
- cuidados especiales.

### Social

- perros;
- gatos;
- niños.

La UI debe distinguir claramente estados positivos/negativos/no especificados según el componente de Figma.

## Contactar para adopción

En la experiencia **En adopción**, el botón de la parte superior derecha es el acceso a **chat/mensajes** para contactar al rescatista. La acción Guardar permanece disponible en cards/detalle.

---

# 7.9 Mascotas guardadas

En el perfil del donante existe un componente/card **Mascotas guardadas**, ubicado por encima de **Rescatistas guardados**.

Al abrirlo, navegar a una pantalla independiente con tabs:

- **Casos de donación**;
- **En adopción**.

Desde esa pantalla se puede:

- abrir el detalle;
- quitar de guardados;
- conservar sincronizado el icono de guardado con cards y detalles.

---

# 7.10 Rescatistas guardados

El donante puede guardar perfiles de rescatistas.

La sección/lista lleva al perfil público correspondiente.

---

# 7.11 Perfil público del rescatista visto por el donante

Debe mostrar como mínimo:

- nombre o nombre del refugio;
- ubicación;
- distancia si Figma la muestra;
- redes sociales;
- información de confianza/verificación;
- número/resumen de casos cuando aplique;
- compartir perfil;
- guardar rescatista;
- reportar.

Tabs principales:

- **Casos**;
- **Actividad**.

Actividad concentra actualizaciones/evidencia relevante del rescatista.

---

# 7.12 Mensajes — Donante

Los mensajes sirven para comunicación con rescatistas, especialmente alrededor de adopción o seguimiento de un caso.

Flujo:

1. abrir lista de conversaciones;
2. seleccionar hilo;
3. ver contexto del caso/mascota cuando el hilo está relacionado;
4. enviar mensaje;
5. marcar notificaciones relacionadas como leídas.

El perfil del donante no debe duplicar el chat como bloque independiente si la navegación ya tiene el acceso correspondiente.

---

# 7.13 Notificaciones — Donante

Pantalla convencional de lista de notificaciones.

Ejemplos:

- “Recibiste un mensaje de…”;
- “Tu donación se envió correctamente”;
- “Hay una nueva evidencia en el caso…”;
- “El caso que apoyaste fue actualizado”.

Al abrir una notificación, navegar al contexto correspondiente.

---

# 7.14 Perfil del donante

El perfil funciona como resumen personal y de impacto.

Puede incluir según los frames vigentes:

- foto/avatar;
- nombre;
- métricas o indicadores personales;
- Impacto total;
- Donation Log resumido;
- Mascotas guardadas;
- Rescatistas guardados;
- Mascotas apadrinadas, si está presente;
- acceso a Settings.

Elementos como Ayuda, Notificaciones y Cerrar sesión no deben estar desperdigados como bloques primarios dentro del perfil si ya están agrupados en Settings/navigation.

---

# 7.15 Settings — Donante

Pantalla separada del perfil.

Debe agrupar:

- editar foto;
- nombre;
- correo;
- teléfono;
- configuración de cuenta cuando esté representada;
- cambiar tipo de cuenta;
- Centro de ayuda;
- cerrar sesión.

Si Figma incluye preferencias de notificaciones dentro de Settings, respetarlas.

---

# 8. Guardián / “Tu Impacto”

Guardián es una suscripción mensual destinada a crear un fondo comunitario que permita apoyar casos urgentes de manera constante.

## 8.1 Objetivo conceptual

La venta no debe sentirse como un “tier competitivo” o un ranking. El valor es:

- apoyo constante;
- fondo disponible para urgencias;
- respuesta más rápida;
- seguimiento posterior;
- transparencia del impacto.

## 8.2 Pantalla de conversión “Tu Impacto”

La versión vigente debe priorizar una experiencia emocional y muy visual.

Estructura esperada:

1. Título principal: **Conviértete en Guardián**.
2. No agregar un párrafo largo inmediatamente debajo del título; la iteración más reciente elimina ese texto explicativo.
3. Carrusel visual grande, con imágenes informativas/emocionales de perros y mensajes sobre cómo funciona el fondo.
4. El carrusel debe ocupar la mayor parte útil de la pantalla evitando scroll vertical innecesario.
5. Social proof del tipo: **“X personas ya forman parte de la comunidad”**.
6. Tres beneficios/checks:
   - **Reporte personalizado**;
   - **Monto ajustable**;
   - **Cancela cuando quieras**.
7. CTA para continuar a la configuración de suscripción.

No mostrar un stepper visual tipo “Paso 1 / Paso 2”.

## 8.3 Selección de monto

La selección de monto no debe saturar la primera pantalla de conversión. Debe aparecer después de que el usuario decide continuar.

Opciones vigentes:

- **$50 MXN**;
- **$200 MXN**;
- **$500 MXN**;
- **Otra cantidad**.

“Outra/Otra cantidad” debe comportarse como texto/acción que, al pulsarse, revela un input para monto personalizado.

**Importante:** estos montos reemplazan configuraciones antiguas como $50/$100/$200.

## 8.4 Confirmación / pago de Guardián

Seguir componentes financieros de Figma. La lógica mínima:

1. elegir monto;
2. revisar recurrencia mensual;
3. confirmar método/pago mock;
4. activar suscripción;
5. desbloquear la experiencia de impacto del Guardián.

## 8.5 Experiencia desbloqueada de impacto

Una vez suscrito, la sección debe mostrar cómo la aportación mensual participa en el fondo y qué casos recibieron apoyo.

Puede incluir:

- fondo disponible;
- casos urgentes apoyados;
- monto liberado;
- pagos en proceso;
- reportes de impacto;
- nuevas actualizaciones;
- evidencias verificadas.

No convertirlo en ranking entre usuarios.

## 8.6 Evidencias verificadas

Cuando el diseño use el badge **Evidencias verificadas**, respetar el tratamiento visual vigente del frame más reciente.

## 8.7 Billing / administración de suscripción

El usuario debe poder:

- ver su monto mensual actual;
- cambiar el monto;
- cancelar la suscripción.

Si Figma muestra pausa, puede mantenerse como acción adicional; no debe reemplazar la capacidad de cancelar.

Al cambiar el monto, la siguiente visualización de la suscripción debe reflejar el nuevo valor.

---

# 9. Experiencia del RESCATISTA

# 9.1 Home / Dashboard de rescatista

Debe funcionar como centro de operación.

Elementos conceptuales:

- estado de verificación;
- acciones pendientes;
- casos recientes/activos;
- acceso a publicar;
- actividad reciente;
- balance/fondos si el diseño vigente lo contempla;
- notificaciones.

**Settings no debe vivir como bloque dentro del home.** Debe ser una pantalla separada.

---

# 9.2 Verificación de cuenta

La verificación es necesaria para generar confianza y operar casos con dinero.

## Datos/documentos conocidos

- identidad/nombre;
- tipo de rescatista cuando aplique;
- ubicación;
- teléfono;
- INE/identificación;
- comprobante de domicilio;
- CLABE/datos bancarios;
- redes sociales.

### Redes sociales

- mínimo **una red social** debe ser obligatoria;
- idealmente permitir conectar Instagram y Facebook;
- usar botones para **vincular** y simular comprobación de propiedad de la cuenta.

**No pedir “Referencias”** como requisito si aparece en un frame antiguo: fue reemplazado por **Comprobante de domicilio**.

## Estados del flujo

### Sin verificación

Mostrar CTA para comenzar/completar datos.

### En revisión

Mostrar que los datos fueron enviados y están siendo revisados.

### Verificado

Mostrar estado positivo y permitir operación normal.

### Con errores / Rechazado

En el home debe existir una card de estado con CTA similar a **Corregir información**.

Al entrar:

- regresar al formulario de verificación;
- mostrar banner superior **Corrige tu información** o equivalente;
- listar claramente los elementos observados;
- resaltar campos/documentos que requieren corrección;
- permitir reenviar.

Ejemplos de errores mock posibles ya usados en prototipo:

- comprobante de domicilio ilegible;
- falta vincular una red social;
- datos bancarios no coinciden.

Nombre de pantalla de referencia para prototipo:

**Rescatista - Verificación con errores**.

## Simulaciones de prototipo

Puede existir un control temporal para simular:

- Verificado;
- Sin verificación;
- Error de verificación.

Debe ser reversible y claramente separado de las acciones reales del usuario.

---

# 9.3 Mis Casos

Pantalla que concentra las publicaciones creadas por el rescatista.

Cada card debe comunicar:

- mascota/caso;
- estado;
- necesidades activas;
- progreso;
- si necesita una acción del rescatista;
- acciones disponibles según estado.

## Estado rechazado

Cuando un caso es rechazado/debe corregirse:

- badge **Rechazado** o equivalente;
- CTA principal **Corregir**;
- CTA secundario **Eliminar**.

### Corregir

Debe regresar al flujo de publicación con los datos existentes precargados y un banner superior que explique qué debe corregirse.

### Eliminar

Debe pedir confirmación antes de borrar.

---

# 10. Flujo de PUBLICAR CASO

Este es el flujo funcional más importante para rescatistas.

## 10.1 Entrada

Desde Home/Mis Casos, CTA **Publicar caso** / **Publicar nuevo caso**.

Si la verificación es requisito en el frame actual, bloquear o redirigir cuando el rescatista no esté verificado. Para prototipo, debe poder demostrarse visualmente el estado bloqueado y el acceso a verificación.

## 10.2 Comportamiento general

- Flujo fragmentado por secciones/pasos lógicos.
- Mantener acciones para continuar y guardar borrador cuando Figma las contemple.
- Al regresar, preservar información ya ingresada.
- La flecha de regresar debe estar al lado izquierdo del **título del paso**, no flotando a la altura del título global “Publicar caso”.
- Evitar que modales/overlays tapen las acciones inferiores Continuar/Guardar borrador.

---

# 10.3 Paso 1 — Información básica

Campos vigentes conocidos:

- fotos;
- nombre/título del caso — **máximo 25 caracteres**;
- nombre de la mascota, si el diseño lo separa del título;
- historia/descripción;
- edad;
- raza;
- tamaño;
- ubicación;
- sexo: **Macho / Hembra**;
- especie/tipo: **Perro / Gato / Otro**.

Si el frame actual contiene algún dato básico adicional, conservarlo.

---

# 10.4 Paso 2 — Objetivo de la publicación

El rescatista elige entre:

1. **Listo para adoptar**.
2. **Solo recibir donaciones**.

## Si elige “Solo recibir donaciones”

Continuar a necesidades.

## Si elige “Listo para adoptar”

Agregar/mostrar la información necesaria de adopción y después continuar a necesidades.

### Salud

Checks:

- vacunado;
- esterilizado;
- cuidados especiales.

### Social

Checks:

- perros;
- gatos;
- niños.

Estos valores deben reflejarse en el detalle de adopción para el donante.

La misma publicación puede tener adopción y necesidades de donación simultáneamente.

---

# 10.5 Paso 3 — Necesidades de la mascota

Las necesidades son **opcionales**. Debe existir claridad de que el rescatista puede publicar una mascota lista para adopción aunque no necesite dinero en ese momento.

Tipos predeterminados vigentes:

- **Veterinario / consulta veterinaria**;
- **Medicina**;
- **Comida**;
- **Otra necesidad**.

Una publicación puede contener varias necesidades.

---

# 10.6 Necesidad: Veterinario / consulta

Es una necesidad de carácter normalmente único.

Debe permitir indicar el monto necesario y los detalles contextuales disponibles en Figma.

Campos/datos que se han definido para esta necesidad incluyen:

- motivo de la consulta;
- hospital/clínica;
- teléfono o dato de contacto del hospital;
- número/identificador de hospital/caso cuando aplique;
- nombre del veterinario;
- teléfono/contacto del veterinario.

No forzar todos estos datos si el frame vigente distingue campos opcionales, pero conservar la estructura si está diseñada.

Puede marcarse como urgente cuando corresponda.

---

# 10.7 Necesidad: Medicina

Debe permitir:

- describir el medicamento/necesidad;
- indicar monto requerido;
- marcar urgencia cuando corresponda;
- definir la vía para cubrir la necesidad según los componentes vigentes.

Es de carácter único: una vez cubierta y completado el proceso de fondos/evidencia/reembolso, deja de ser una necesidad activa.

---

# 10.8 Necesidad: Comida

Es la necesidad con comportamiento especial de recurrencia.

Debe permitir:

- elegir comida mediante el catálogo cuando exista;
- indicar monto requerido;
- indicar cuántas veces se necesita recibir/comprar;
- habilitar recurrencia;
- usar **mensual** como frecuencia predeterminada cuando el flujo trabaja con recurrencia.

La comida puede volver a solicitarse después de completar una ronda.

---

# 10.9 Necesidad: Otra

Permite capturar una necesidad que no entra en Veterinario, Medicina o Comida.

Mantenerla flexible y guiada por los componentes del frame actual. No asumir automáticamente que tiene la misma lógica de recurrencia de Comida.

---

# 10.10 Urgencia

La marca **Urgente** se utiliza para necesidades médicas/veterinarias donde exista justificación.

Al marcar una necesidad como urgente:

- mostrar microcopy equivalente a **“Se requiere evidencia de urgencia”**;
- solicitar **Video de evidencia de urgencia**;
- el video debe mostrar al rescatista y a la mascota;
- el caso/necesidad queda sujeto a revisión de DopMi.

La urgencia debe reflejarse como tag en cards y detalle.

---

# 10.11 Forma de cubrir una necesidad

El sistema contempla dos modelos conceptuales:

1. **Recibir fondos** para cubrir la necesidad.
2. **Comprar la necesidad externamente** cuando el flujo lo permite.

La UI exacta depende del tipo de necesidad y del estado.

Para comida ya fondeada existe explícitamente la convivencia de dos CTAs:

- **Receive / Recibir**;
- **Comprar**.

**Comprar** dirige a una página externa para adquirir la comida.

---

# 10.12 Reembolso

Cuando el rescatista ya realizó un gasto y solicita reembolso, el flujo debe pedir evidencia suficiente para validar la compra.

Como mínimo puede contemplar:

- cantidad a reembolsar;
- ticket/recibo;
- ID de compra cuando aplique;
- fotografía/video con la mascota cuando aplique;
- descripción/comentario.

La interfaz exacta debe seguir Figma.

La aprobación/rechazo se simula como una revisión de DopMi.

---

# 10.13 Guardar borrador

El rescatista puede salir del flujo sin perder el caso cuando existe el CTA de borrador.

Al regresar:

- abrir los datos precargados;
- mantener las necesidades agregadas;
- mantener archivos mock seleccionados;
- permitir continuar desde el punto lógico correspondiente.

---

# 10.14 Enviar a revisión / Publicar

Al finalizar:

1. revisar resumen;
2. enviar;
3. cambiar estado de Borrador a En revisión;
4. simular aprobación o rechazo.

## Aprobado

El caso pasa a Activo/publicado.

## Rechazado

Aparece en Mis Casos con **Corregir** y **Eliminar**.

---

# 11. Edición de caso

El rescatista puede editar un caso existente.

Debe precargar todos los datos originales.

Cambios en necesidades pueden afectar a donantes o aportaciones recurrentes. Cuando exista un compromiso recurrente activo, no modificar silenciosamente información crítica: el prototipo debe representar notificación/confirmación cuando Figma la contemple.

---

# 12. Cerrar caso

Dentro de la edición de un caso debe existir la acción **Cerrar caso**.

Al pulsarla abrir modal de confirmación.

## Motivo de cierre

Opciones:

- **Ya fue adoptada**;
- **Otro motivo** — permite escribir explicación.

## Si fue adoptada

Antes de confirmar el cierre, ofrecer la opción de cargar un **video de despedida**.

Al confirmar:

- estado pasa a Cerrado/Completado;
- dejar de mostrar necesidades como activas;
- conservar historial, evidencias e impacto previo.

---

# 13. Ciclo de una necesidad fondeada

Flujo genérico:

1. Donantes financian necesidad.
2. Se alcanza el monto requerido.
3. La necesidad pasa a Fondeada.
4. El rescatista ejecuta la acción correspondiente.
5. Sube evidencia.
6. DopMi revisa.
7. Se liberan fondos/reembolso o se valida la compra según el modelo.
8. Se publica evidencia.
9. Donantes reciben actualización.
10. Necesidad se completa o se reactiva si es comida recurrente.

---

# 14. Flujo especial de COMIDA después de fondearse

Este flujo debe implementarse con especial cuidado.

## 14.1 Estado fondeado

Cuando la comida ya tiene todos los fondos, el rescatista ve:

- **Receive / Recibir**;
- **Comprar**.

## 14.2 Comprar

- abre/linkea una página externa;
- el rescatista realiza compra mock;
- después entra al flujo de evidencia.

## 14.3 Evidencia

Después de completar la evidencia de comida, ofrecer:

- **Solicitar comida**;
- **Salir**.

### Solicitar comida

Abre nuevamente el catálogo para seleccionar comida.

Dentro de ese flujo debe existir:

- posibilidad de elegir otro producto;
- acción secundaria **Misma comida** para reactivar exactamente la necesidad anterior.

### Salir

No reactiva la comida.

Sin embargo, después el rescatista debe conservar una acción **Solicitar comida** desde la pantalla de casos/detalle para volver a iniciar la necesidad cuando se requiera.

---

# 15. Evidencia

La evidencia es parte esencial de la transparencia de DopMi.

Puede incluir:

- ticket/recibo;
- ID de compra;
- fotografía;
- video;
- descripción;
- evidencia específica de urgencia.

Debe poder guardarse parcialmente cuando el flujo lo contemple.

Una evidencia aprobada debe verse reflejada en:

- detalle del caso;
- actividad del rescatista;
- historial/impacto del donante correspondiente;
- superficies públicas de seguimiento que existan en Figma.

---

# 16. Fondos y liberación

Conceptualmente, DopMi no debe representar el dinero como disponible para el rescatista sin control cuando el flujo exige evidencia.

Cuando el diseño lo indica:

- fondos quedan bloqueados hasta completar requisitos;
- rescatista sube evidencia;
- revisión aprueba;
- fondos/reembolso se liberan;
- el estado se actualiza.

El prototipo puede simular la revisión mediante botones/estados de prueba.

---

# 17. Mensajes — Rescatista

El rescatista puede recibir y responder mensajes de:

- personas interesadas en adopción;
- donantes;
- potencialmente mensajes operativos vinculados a un caso.

Flujo:

1. lista de conversaciones;
2. abrir hilo;
3. ver contexto de mascota/caso;
4. responder;
5. actualizar unread count;
6. notificación correspondiente.

---

# 18. Notificaciones — Rescatista

Ejemplos:

- nueva donación;
- necesidad alcanzó la meta;
- evidencia requiere corrección;
- verificación aprobada/rechazada;
- caso aprobado/rechazado;
- nuevo mensaje;
- actualización de reembolso.

Abrir una notificación debe navegar a la pantalla relevante.

---

# 19. Perfil del rescatista

## 19.1 Perfil propio

Debe permitir acceder a:

- información pública;
- casos;
- actividad;
- Settings;
- estado de verificación cuando corresponda.

## 19.2 Perfil público

Visto por otros usuarios:

- nombre/refugio;
- ubicación;
- redes;
- estado de confianza/verificación;
- casos;
- actividad/evidencias;
- guardar;
- compartir;
- reportar.

---

# 20. Settings — Rescatista

Pantalla independiente, no bloque del dashboard.

Debe agrupar:

- información personal;
- foto/nombre cuando aplique;
- correo;
- teléfono;
- CLABE/datos bancarios;
- redes sociales;
- cambiar tipo de cuenta;
- Centro de ayuda;
- cerrar sesión.

---

# 21. Cambio de tipo de cuenta

El producto contempla la posibilidad de cambiar entre experiencias de cuenta desde Settings o el componente diseñado para ello.

Para el prototipo:

- cambiar el rol debe cambiar navegación y home;
- no borrar los datos mock del rol anterior;
- permitir volver al rol original;
- dejar claro visualmente qué tipo de cuenta está activo.

---

# 22. Centro de ayuda

Debe existir para ambos perfiles.

Puede concentrar:

- preguntas frecuentes;
- ayuda sobre donaciones;
- adopción;
- publicación de casos;
- evidencia/reembolsos;
- cuenta/verificación;
- contacto/soporte.

Usar la estructura visual de Figma; no hace falta construir un sistema de soporte real.

---

# 23. Pantallas y nombres de referencia

Esta lista sirve a Cursor para identificar frames y rutas lógicas. Cuando el nombre exacto del frame sea diferente, priorizar el frame visible pero mantener la función.

## Acceso

- Account Type / Tipo de cuenta
- Donor Onboarding
- Rescuer Onboarding
- Login
- Sign Up
- Forgot Password
- Terms and Conditions

## Donante

- Donor Home
- Cases / Explorar casos
- Case Detail
- Donation Flow
- Payment Error
- Donation History
- Adoption
- Adoption Detail
- Messages
- Conversation Detail
- Notifications
- Donor Profile
- Saved Pets
- Saved Rescuers
- Rescuer Public Profile
- Tu Impacto
- Guardian Subscribe
- Guardian Impact
- Billing
- Donor Settings
- Help Center

## Rescatista

- Rescuer Home / Dashboard
- Verification
- Rescatista - Verificación con errores
- Mis Casos
- Publish Case — Basic Info
- Publish Case — Goal / Adoption
- Publish Case — Needs
- Publish Case — Need Detail
- Publish Case — Review
- Case Detail — Rescuer
- Edit Case
- Correct Case
- Close Case modal
- Evidence
- Reimbursement
- Food Purchase / Food Evidence
- Request Food Again
- Messages
- Conversation Detail
- Notifications
- Rescuer Profile
- Rescuer Settings
- Help Center

---

# 24. Matriz de permisos

| Acción | Donante | Rescatista | Admin |
|---|---:|---:|---:|
| Ver casos publicados | Sí | Sí | Sí |
| Donar | Sí | No como función principal | No |
| Guardar mascota | Sí | Opcional según Figma | No |
| Guardar rescatista | Sí | No | No |
| Contactar por adopción | Sí | Responde | No |
| Publicar caso | No | Sí | No |
| Editar caso propio | No | Sí | Administra/revisa |
| Eliminar caso rechazado propio | No | Sí | Sí según permisos |
| Cerrar caso propio | No | Sí | Puede operar según permisos |
| Subir evidencia | No | Sí | Revisa |
| Solicitar reembolso | No | Sí | Revisa/aprueba/rechaza |
| Ver historial de donaciones propio | Sí | No | Puede consultar operación |
| Suscribirse a Guardián | Sí | No | No |
| Editar monto Guardián | Sí | No | No |
| Verificación de rescatista | No | Envía/corrige | Revisa |

---

# 25. Reglas de consistencia visual-funcional

1. Una misma mascota debe usar la misma foto/nombre entre card, detalle, historial, chat y guardados.
2. Los montos de recaudación deben actualizarse en todas las vistas después de una donación mock.
3. Un pago fallido nunca debe cambiar el progreso.
4. Guardar/desguardar debe sincronizarse entre pantallas.
5. Un caso rechazado debe abrirse en modo corrección, no como publicación vacía.
6. Un caso cerrado no debe seguir aceptando donaciones.
7. Una necesidad completada no debe mostrar CTA Donar.
8. Comida puede reactivarse; medicina/veterinario no deben reactivarse automáticamente.
9. Una suscripción Guardián cancelada no debe seguir apareciendo como activa.
10. Cambiar el monto de Guardián debe actualizar Billing e Impacto.
11. La evidencia aprobada debe quedar accesible como seguimiento histórico.
12. El perfil del rescatista y sus casos deben compartir el mismo estado de verificación.
13. Si un rescatista pasa a Sin verificación en la simulación, debe requerir completar nuevamente el proceso para volver a En revisión.

---

# 26. Estados mock recomendados para demostrar el prototipo

Para que el prototipo sea fácil de revisar, incluir datos que cubran varios estados simultáneamente.

## Casos ejemplo

### Caso A — activo y fondeándose

- necesidad Medicina;
- 60–80 % fondeado;
- CTA Donar activo.

### Caso B — comida fondeada

- muestra Receive + Comprar;
- sirve para recorrer evidencia y Solicitar comida.

### Caso C — urgencia

- etiqueta Urgente;
- evidencia de urgencia disponible.

### Caso D — adopción

- listo para adoptar;
- muestra Salud/Social;
- CTA de chat.

### Caso E — rechazado del rescatista

- CTA Corregir;
- CTA Eliminar;
- banner de correcciones.

### Caso F — cerrado

- historial visible;
- sin CTA de donación.

---

# 27. Comportamientos de prototipo que Cursor debe implementar

## 27.1 Persistencia local

Mantener estado mientras la app está abierta:

- usuario activo;
- tipo de cuenta;
- guardados;
- donaciones mock;
- suscripción Guardián;
- verificación;
- borradores;
- casos;
- mensajes;
- notificaciones leídas/no leídas.

Local storage es suficiente si la tecnología elegida lo permite.

## 27.2 Navegación profunda

Los siguientes objetos deben poder abrirse desde múltiples contextos:

- Case Detail desde Home, listado, historial, guardados, notificaciones.
- Rescuer Public Profile desde Case Detail y guardados.
- Conversation Detail desde adopción, lista de mensajes y notificaciones.
- Evidence desde actividad, detalle de caso e impacto.

## 27.3 Modales

Usarlos para acciones de decisión/confirmación cuando el frame los contemple, por ejemplo:

- cerrar caso;
- eliminar caso;
- cancelar sponsor;
- cancelar Guardián;
- confirmaciones sensibles.

## 27.4 Estados vacíos

Preparar estados vacíos creíbles para:

- sin donaciones;
- sin guardados;
- sin mensajes;
- sin notificaciones;
- sin casos publicados;
- sin reportes de impacto todavía.

No crear páginas visualmente rotas por falta de datos.

---

# 28. Flujos end-to-end prioritarios

Cursor debe asegurar que, como mínimo, estos recorridos funcionen completos.

## Flujo A — Donación exitosa

Home → Caso → Necesidad → Donar → Confirmar pago → Éxito → Caso actualizado → Historial actualizado → Notificación.

## Flujo B — Error de pago

Caso → Donar → Confirmar → Payment Error → Reintentar o regresar → Sin modificación del progreso.

## Flujo C — Adopción y contacto

Adopción → Filtrar → Mascota → Revisar Salud/Social → Abrir chat → Enviar mensaje → Conversación aparece en Mensajes.

## Flujo D — Guardar mascota

Card/Detalle → Guardar → Perfil → Mascotas guardadas → tab correspondiente → abrir detalle → quitar guardado.

## Flujo E — Guardián

Tu Impacto → Conviértete en Guardián → carrusel/social proof → Continuar → elegir $50/$200/$500 u Otra cantidad → confirmar → Impacto desbloqueado → Billing → cambiar monto/cancelar.

## Flujo F — Verificar rescatista

Rescuer Home → Verificación → llenar datos/documentos → enviar → En revisión → simular Verificado.

## Flujo G — Error de verificación

Home → card de verificación con errores → Corregir → formulario precargado + banner → corregir → reenviar → En revisión.

## Flujo H — Publicar caso sin necesidades

Rescuer Home → Publicar → Información básica → Listo para adoptar → Salud/Social → Necesidades: omitir → Revisar → Enviar → En revisión → simular Activo → aparece en Adopción.

## Flujo I — Publicar caso con donaciones

Rescuer Home → Publicar → Información básica → Solo recibir donaciones → agregar Medicina/Veterinario/Comida → revisar → enviar → En revisión → Activo → visible a donante.

## Flujo J — Caso rechazado

Mis Casos → Rechazado → Corregir → banner de observaciones → editar → reenviar → En revisión.

## Flujo K — Comida fondeada

Mis Casos → detalle → comida fondeada → Comprar o Receive → evidencia → revisión → completar → Solicitar comida → catálogo → elegir nueva o Misma comida → necesidad activa otra vez.

## Flujo L — Cerrar caso por adopción

Mis Casos → Editar → Cerrar caso → Ya fue adoptada → cargar video de despedida opcional → confirmar → Cerrado.

---

# 29. Reglas vigentes que reemplazan versiones antiguas

Esta sección es crítica para Cursor cuando MCP exponga frames de distintas iteraciones.

## 29.1 Guardián

**Vigente:** $50 / $200 / $500 + Otra cantidad.  
**Obsoleto:** $50 / $100 / $200 como selección principal de producto autenticado.

## 29.2 Flujo inicial

**Vigente:** elegir tipo de cuenta → onboarding contextual → login/signup.  
**Obsoleto:** obligar login antes de enseñar onboarding contextual.

## 29.3 Verificación de rescatista

**Vigente:** Comprobante de domicilio + mínimo una red social vinculada.  
**Obsoleto:** Referencias como requisito principal.

## 29.4 Settings rescatista

**Vigente:** pantalla independiente.  
**Obsoleto:** Settings incrustado como sección del dashboard.

## 29.5 Verificación simulada

**Vigente:** “Sin verificación” significa empezar de cero y volver a enviar.  
**Obsoleto:** usar “Sin verificación” como sinónimo de “Pendiente”.

## 29.6 Tu Impacto / conversión a Guardián

**Vigente:** sin stepper visible; carrusel grande; social proof; tres checks; monto en una vista posterior.  
**Obsoleto:** pasos numerados y selector de monto en la primera pantalla de conversión.

## 29.7 Perfil y Settings

**Vigente:** acciones de configuración, ayuda y logout agrupadas en Settings cuando el diseño ya cuenta con esa pantalla.  
**Obsoleto:** repetir esos accesos como bloques principales en el perfil.

---

# 30. Qué NO debe inferir Cursor

No inventar sin evidencia en Figma o en este documento:

- reglas fiscales;
- comisiones;
- porcentajes de fee;
- tiempos reales de transferencia;
- requisitos legales adicionales;
- algoritmos de recomendación;
- sistema real de fraude;
- límites de donación;
- proveedores de pago;
- reglas KYC adicionales;
- scoring de rescatistas;
- ranking de Guardián;
- lógica de matching automático de adopción.

Para el prototipo, esas áreas pueden representarse como estados mock simples si una pantalla las necesita.

---

# 31. Datos y copy: regla de prioridad

Cuando el frame tenga copy específico, conservarlo. Si el mismo elemento aparece con copy diferente en un frame más reciente, usar el más reciente.

No traducir arbitrariamente labels si Figma usa términos en inglés como nombres internos de pantalla, por ejemplo **Payment Error**. El contenido visible al usuario debe seguir el idioma del diseño, predominantemente español.

---

# 32. Responsive

El producto debe conservar la intención del diseño en distintos tamaños.

- Mobile: navegación compacta, cards apiladas, CTAs accesibles.
- Tablet/desktop: aprovechar anchura sin convertir una pantalla móvil en una tabla administrativa.
- Modales deben adaptarse a viewport pequeño.
- Carrusel Guardián debe evitar generar scroll vertical innecesario.
- Formularios largos deben conservar jerarquía y acciones visibles.

Si Figma contiene variantes responsive explícitas, esas variantes ganan sobre cualquier regla genérica de esta sección.

---

# 33. Accesibilidad mínima para el prototipo

Sin rediseñar Figma:

- botones con área de interacción suficiente;
- estados no comunicados únicamente por color;
- labels visibles en inputs;
- foco claro si el prototipo web lo soporta;
- textos alternativos básicos para imágenes relevantes;
- contraste razonable siguiendo componentes ya diseñados.

---

# 34. Criterios de aceptación del prototipo

El prototipo se considera funcionalmente fiel cuando:

1. Donante y Rescatista tienen experiencias claramente distintas.
2. El cambio de cuenta funciona sin perder estado mock.
3. Los casos tienen estados coherentes.
4. Donar actualiza el progreso solo en éxito.
5. Payment Error no registra una donación.
6. Historial de donaciones refleja aportaciones realizadas.
7. Guardar/desguardar se sincroniza.
8. Adopción muestra Salud/Social y abre chat.
9. Guardián usa $50/$200/$500 + Otra cantidad.
10. Billing permite editar monto y cancelar.
11. Verificación de rescatista tiene Sin verificación, En revisión, Verificado y Con errores.
12. El error de verificación vuelve al formulario con banner y datos precargados.
13. Publicar caso conserva los datos entre pasos.
14. El rescatista puede publicar sin necesidades.
15. Un caso puede ser adopción + donaciones.
16. Comida puede ser recurrente y reactivarse.
17. Medicina/Veterinario se comportan como necesidades únicas.
18. Urgencia exige evidencia específica.
19. Caso rechazado puede corregirse o eliminarse.
20. Cerrar caso permite motivo y opción de video si fue adoptado.
21. Evidencia actualiza el seguimiento visible.
22. Notificaciones navegan a su contexto.
23. No hay CTAs principales sin función en los recorridos prioritarios.

---

# 35. Apéndice — Administración interna de DopMi

Incluir esta parte únicamente si los frames administrativos están dentro del archivo de Figma conectado a Cursor.

## 35.1 Estructura de navegación

Sidebar expandible con al menos:

### Verificación

- Usuarios;
- Casos de Donación;
- Reembolsos;
- Cashback Donante.

### Usuarios

- Rescatistas;
- Donantes;
- Internos.

## 35.2 Patrón de pantallas

- tabla/listado;
- búsqueda;
- filtros;
- estatus;
- paginación si aparece;
- clic a detalle;
- acciones según permiso.

## 35.3 Verificación de rescatistas

Detalle puede mostrar:

- identidad;
- tipo;
- ubicación;
- INE;
- comprobante de domicilio;
- CLABE;
- teléfono;
- redes vinculadas.

Acciones:

- verificar/aprobar;
- rechazar;
- solicitar correcciones.

## 35.4 Casos de donación

El admin puede revisar:

- formulario completo;
- mascota;
- necesidades;
- urgencia/evidencia;
- estado.

Acciones:

- aprobar;
- rechazar;
- revisar detalle.

## 35.5 Reembolsos

Puede requerir:

- ticket;
- ID de compra;
- foto/video con mascota;
- descripción;
- monto;
- otros indicadores internos si ya aparecen en Figma.

Acciones:

- aprobar;
- rechazar;
- solicitar corrección.

Cuando se rechaza una operación que requiere comunicación, puede generarse un mensaje al chat del rescatista.

## 35.6 Usuarios

Perfiles administrativos pueden tener tabs según el tipo, por ejemplo:

- Perfil;
- Casos;
- Donaciones;
- Reembolsos;
- Cashback;
- Evidencias;
- Mensajes;
- Actividad.

No todos los tabs aplican a todos los tipos de usuario.

---

# 36. Apéndice — Superficie pública / landing, si está incluida en Figma

La landing pública de DopMi puede explicar el producto antes de autenticación.

Secciones conceptuales conocidas:

- Adoptar;
- Guardián;
- Rescatistas;
- Confianza;
- Centro de ayuda;
- Privacidad;
- Términos.

CTA destacado para rescatistas: **Soy rescatista** / equivalente vigente.

La sección Confianza debe reforzar:

- quién publica;
- qué necesita;
- cuánto falta;
- qué seguimiento existe;
- mayor revisión cuando entra dinero de por medio.

No usar los montos antiguos de Guardián de una landing previa para sobreescribir el producto autenticado. La configuración vigente del flujo es $50/$200/$500 + Otra cantidad.

---

# 37. Guía práctica para Cursor al leer Figma por MCP

Al inspeccionar cada frame:

1. Identificar a qué rol pertenece.
2. Identificar la entidad principal: Case, Need, Donation, Evidence, User, Guardian, Chat, etc.
3. Identificar estado de esa entidad.
4. Mapear cada CTA a un destino o transición.
5. Reutilizar componentes existentes antes de inventar nuevos.
6. Mantener los datos del ejemplo consistentes entre pantallas.
7. Conectar back navigation de forma lógica.
8. Si una pantalla es un estado alterno, no crear una ruta aislada sin forma de llegar a ella.
9. Crear controles temporales de simulación únicamente cuando ayuden a demostrar estados de revisión/pago/verificación.
10. Mantener esos controles separados del UI final del usuario cuando sea posible.

---

# 38. Resumen operativo de una línea por área

- **Donar:** aportar a una necesidad concreta y seguir qué pasó con el dinero.
- **Adoptar:** descubrir una mascota, revisar compatibilidad básica y contactar al rescatista.
- **Publicar:** convertir un rescate en un caso estructurado, con adopción y/o necesidades.
- **Necesidades:** representar exactamente qué se requiere y cuánto falta.
- **Evidencia:** demostrar el uso de la ayuda y alimentar la transparencia.
- **Comida:** necesidad recurrente que puede reactivarse después de completar una ronda.
- **Medicina/Veterinario:** necesidades normalmente únicas y potencialmente urgentes.
- **Guardián:** suscripción mensual que alimenta un fondo comunitario para urgencias.
- **Impacto:** conectar aportaciones con casos, avances y evidencias.
- **Verificación:** establecer confianza antes de operar como rescatista.
- **Mensajes:** canal contextual entre donantes/interesados y rescatistas.
- **Notificaciones:** llevar al usuario hacia cambios accionables del producto.

---

# 39. Regla final

**No implementar pantallas como imágenes estáticas enlazadas.** El prototipo debe demostrar que DopMi es un sistema: la información y los estados cambian a través de los flujos y esos cambios se reflejan en todas las superficies relacionadas.

Figma dice **cómo se ve**.  
Este documento dice **qué significa y qué debe pasar**.
