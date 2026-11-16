# Raíz · tienda online de demostración

Tienda de plantas de interior programada desde cero, con un recomendador que te dice qué planta va a sobrevivir en tu casa. Mueves una maceta en un dibujo de tu habitación para medir la luz, contestas cómo riegas, si tienes mascotas y qué hueco quieres llenar, y mientras respondes una planta dibujada va creciendo hasta darte tus tres plantas con su porcentaje de afinidad.

**Verla publicada:** https://raiz.dania360.com/

## Cómo está hecha
- HTML, CSS y JavaScript propios, sin framework ni librerías externas
- Recomendador (`js/datos.js`): puntúa cada planta según luz, riego, mascotas, espacio y experiencia, y explica sus motivos
- Simulador de luz y planta que crece dibujados por código en SVG (`js/planta.js`)
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
