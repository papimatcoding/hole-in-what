# Taller de mapas en `dev`

Abre **BETA LAB** desde el menú. El editor existente conserva el guardado local, selección, arrastre, cambio de tamaño, duplicado, deshacer y **TEST** con la física real. Las flechas cambian la herramienta; **ROTAR** orienta la siguiente pieza y rota una pieza seleccionada.

## Crear un hoyo

- Arrastra para crear muro, triángulo, superficies, rampa, muro móvil o trampa rectangular. Un triángulo forma una esquina/banco de la caja arrastrada; usa **ROTAR** para elegir el ángulo. Haz clic para colocar bola, hoyo, bumper, curva, trampolín, portal o bumper móvil.
- **TRAMPA MURO**, **TRAMPA BUMPER** y **TRAMPA SUELO** requieren dos pasos: coloca la pieza y luego marca el punto que la activa. El círculo indica el radio de activación en edición; la pieza oculta aparece al jugar. Selecciona el centro del círculo para mover el activador. Al mover o duplicar la pieza, su activador la acompaña.
- Prueba la línea que parece segura y la salida aprendida con **TEST**. La prueba de un suelo que cae reinicia la bola. Ajusta los objetivos de estrellas tocando el contador superior.
- **PROPUESTAS** abre un formulario con título, autor e intención de diseño. **Descargar propuesta JSON** genera un archivo para compartir. El JSON antiguo del botón superior sigue siendo una exportación cruda del nivel para desarrolladores.

## Revisar propuestas

El revisor abre **PROPUESTAS**, importa el JSON recibido y lo encuentra en la bandeja local. **Vista previa / editar** carga una copia en el editor; después de probarla puede volver a la bandeja para **Aceptar** o **Rechazar**. El rechazo exige un motivo. **Descargar revisión** crea un JSON con la decisión y la nota para devolver al autor.

La bandeja vive en el almacenamiento del navegador donde se importó. No hay una cola compartida ni cuentas de revisor: el intercambio de archivos es manual. Aceptar significa aprobación de diseño en esa bandeja; no inserta el nivel en la campaña ni lo publica para jugadores. Antes de incorporarlo al juego, hay que revisar geometría, rutas y trampas con el audit completo y probarlo en pantalla táctil y escritorio. No se exponen propuestas por Community Maps, que sigue desactivado.

## Criterio de revisión

Para cada geometría, anota qué ángulo o tiro permite. Para cada trampa, anota el tiro tentador, la consecuencia, la respuesta aprendida y la recuperación posible. Si una pieza no cambia ninguna decisión o una trampa queda debajo de un salto, hay que rediseñarla. La comprobación de formato del importador evita niveles mal formados; no certifica que un mapa sea divertido o justo.
