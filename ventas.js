const productoSelect = document.getElementById('producto-select');
const formVenta = document.getElementById('form-venta');
const tablaVentas = document.getElementById('tabla-ventas');

// --- 1. LLENAR SELECTOR ---
const cargarProductosAlSelector = async () => {
    try {
        const respuesta = await fetch('/suplementos');
        const productos = await respuesta.json();

        productoSelect.innerHTML = '<option value="">SELECCIONAR PRODUCTO...</option>';
        
        productos.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.id;
            // Guardamos el precio como atributo para que el JS lo lea fácil
            option.setAttribute('data-precio', prod.precio); 
            option.textContent = `${prod.nombre.toUpperCase()} - $${prod.precio} (Stock: ${prod.stock})`;
            productoSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
};

// --- 2. CARGAR TABLA ---
const cargarTablaVentas = async () => {
    try {
        const respuesta = await fetch('/api-ventas');
        const ventas = await respuesta.json();
        
        tablaVentas.innerHTML = '';

        if (ventas.length === 0) {
            tablaVentas.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay ventas hoy</td></tr>';
            return;
        }

        ventas.forEach(v => {
            // Formateamos la fecha para que no se vea rara
            const fechaFormateada = new Date(v.fecha).toLocaleDateString('es-MX', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            tablaVentas.innerHTML += `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td><strong>${v.producto_nombre}</strong></td>
                    <td>${v.cantidad}</td>
                    <td>$${v.total}</td>
                    <td>${v.cliente || 'Público Gral.'}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar historial:", error);
    }
};

// --- 3. EVENTO PARA REGISTRAR LA VENTA ---
formVenta.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idProducto = productoSelect.value;
    const cantidad = document.getElementById('cantidad-venta').value;
    const cliente = document.getElementById('cliente').value;
    const filaSeleccionada = productoSelect.options[productoSelect.selectedIndex];
    
    if (!idProducto) {
        alert("⚠️ Selecciona un producto.");
        return;
    }

    const precioUnitario = filaSeleccionada.getAttribute('data-precio');

    const datosVenta = {
        producto_id: idProducto,
        cantidad: parseInt(cantidad),
        total: (parseInt(cantidad) * parseFloat(precioUnitario)).toFixed(2),
        cliente: cliente
    };

    try {
        const respuesta = await fetch('/api-ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });

        if (respuesta.ok) {
            alert('✅ Venta registrada!');
            formVenta.reset();
            // Esto actualiza la tabla y el stock en el selector sin recargar la página
            await cargarProductosAlSelector();
            await cargarTablaVentas();
        } else {
            const err = await respuesta.json();
            alert("❌ Error: " + err.error);
        }
    } catch (error) {
        alert("❌ Error de conexión");
    }
});

// EJECUTAR AL CARGAR
document.addEventListener('DOMContentLoaded', () => {
    cargarProductosAlSelector();
    cargarTablaVentas();
});