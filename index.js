// Referencias a los elementos del HTML
const formulario = document.getElementById('form-suplemento');
const tabla = document.getElementById('tabla-suplementos');

// --- 1. FUNCIÓN PARA LEER (READ) ---
const cargarSuplementos = async () => {
    try {
        const respuesta = await fetch('/suplementos');
        // Si el servidor nos dice que no estamos autorizados (porque expiró la sesión)
        if (respuesta.status === 401) {
            window.location.href = '/login';
            return;
        }
        const suplementos = await respuesta.json();
        
        tabla.innerHTML = ''; 
        suplementos.forEach(sup => {
            tabla.innerHTML += `
                <tr>
                    <td>${sup.nombre}</td>
                    <td>${sup.marca}</td>
                    <td>$${sup.precio}</td>
                    <td>${sup.stock}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editar(${sup.id})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminar(${sup.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al cargar:", error);
    }
};

// --- 2. FUNCIÓN PARA CREAR (CREATE) ---
formulario.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const datos = {
        nombre: document.getElementById('nombre').value,
        marca: document.getElementById('marca').value,
        precio: document.getElementById('precio').value,
        stock: document.getElementById('stock').value
    };

    try {
        const respuesta = await fetch('/suplementos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (respuesta.ok) {
            alert('✅ Suplemento guardado con éxito');
            formulario.reset();
            cargarSuplementos(); 
        }
    } catch (error) {
        alert("Error al guardar");
    }
});

// --- 3. FUNCIÓN PARA ELIMINAR (DELETE) ---
window.eliminar = async (id) => {
    if (confirm('¿Seguro que quieres eliminar este suplemento?')) {
        try {
            const respuesta = await fetch(`/suplementos/${id}`, {
                method: 'DELETE'
            });
            if (respuesta.ok) {
                cargarSuplementos(); 
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    }
};

// --- 4. FUNCIÓN PARA EDITAR (UPDATE) ---
window.editar = async (id) => {
    const nuevoNombre = prompt("Nuevo nombre del suplemento:");
    const nuevaMarca = prompt("Nueva marca:");
    const nuevoPrecio = prompt("Nuevo precio:");
    const nuevoStock = prompt("Nuevo stock:");

    // Solo procedemos si el usuario no dejó los campos vacíos importantes
    if (nuevoNombre && nuevaMarca && nuevoPrecio && nuevoStock) {
        const datos = {
            nombre: nuevoNombre,
            marca: nuevaMarca,
            precio: nuevoPrecio,
            stock: nuevoStock
        };

        try {
            const respuesta = await fetch(`/suplementos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            
            if (respuesta.ok) {
                alert("Actualizado con éxito");
                cargarSuplementos();
            }
        } catch (error) {
            console.error("Error al editar:", error);
        }
    } else {
        alert("Debes llenar todos los campos para editar.");
    }
};

// Ejecutar automáticamente al cargar la página
cargarSuplementos();