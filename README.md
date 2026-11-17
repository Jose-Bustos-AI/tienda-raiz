# Raíz · tienda online de demostración

Tienda de plantas de interior programada desde cero. En la portada, una Monstera en 3D crece hoja a hoja mientras bajas, con el contador de semanas y centímetros. Y el recomendador es un salón en 3D: arrastras la planta por la habitación para medir la luz que entra por la ventana, y con cada respuesta el salón cambia (la regadera riega, aparece el gato, la planta cambia de tamaño, llegan más plantas) hasta darte tus tres plantas con su porcentaje de afinidad.

**Verla publicada:** https://raiz.dania360.com/

## Cómo está hecha
- HTML, CSS y JavaScript propios, sin framework; solo three.js para el 3D
- Recomendador (`js/datos.js`): puntúa cada planta según luz, riego, mascotas, espacio y experiencia, y explica sus motivos
- Plantas y salón en 3D construidos por código (`js/jardin3d.js`): no hay modelos descargados. Cada hoja es una malla con su silueta (la Monstera, con sus cortes y agujeros), curvada y con los nervios pintados
- Portada ligada al scroll: la Monstera pasa de esqueje a planta adulta, con etiquetas de cuidados que siguen a las hojas
- Salón del recomendador con la mancha de sol que cambia según hacia dónde mira la ventana; la planta se arrastra con el dedo o el ratón
- Pensado para gráficas modestas: tres shaders en total, sin mapas de sombra, compilados sin bloquear la página
- Si el dispositivo no admite 3D, se queda la versión dibujada en SVG (`js/planta.js`)
- Ficha de cuidados de cada planta y calendario de riego de las próximas cuatro semanas
- Al terminar el pedido, el calendario de riego se puede añadir al móvil con un archivo `.ics` generado en el navegador
- Tamaños y macetas que suman al precio, filtros combinables (aptas para mascotas, muy fáciles, poca luz), favoritos y buscador
- Carrito con código de descuento BIENVENIDA10 y sugerencia del kit de cuidado
- Pago de demostración en tres pasos con opción de regalo y mensaje
- Preguntas frecuentes desplegables en la portada
- Respeta a quien pide menos animación en su dispositivo
- Alojada en Vercel

## Verla en local
```
python -m http.server 8000
```
y abre http://localhost:8000/

## Sobre esta tienda
Diseño y desarrollo de [Dania360](https://dania360.com). Es una tienda de ejemplo: la marca es inventada, las fotos se crearon para la marca, el pago no cobra nada y la web no se indexa en buscadores (`noindex`). El código se publica para enseñar cómo está hecha; no tiene licencia de uso.

Más tiendas en el portafolio: https://tiendas.dania360.com
