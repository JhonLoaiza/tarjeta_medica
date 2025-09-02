// public/app.js
const API_URL = (location.origin.endsWith(":3000") ? location.origin : (location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') ));
const form = document.getElementById("fichaForm");
const limpiarBtn = document.getElementById("limpiarBtn");
const cerrarBtn = document.getElementById("cerrarBtn");
const buscarBtn = document.getElementById("buscarBtn");
const resultadoBusqueda = document.getElementById("resultadoBusqueda");

function validarCliente(data) {
  const errors = [];
  if (!data.rut || data.rut.trim().length < 3) errors.push("RUT inválido");
  if (!data.nombres || data.nombres.trim().length < 2) errors.push("Nombres inválidos");
  if (!data.apellidos || data.apellidos.trim().length < 2) errors.push("Apellidos inválidos");
  if (!data.direccion || data.direccion.trim().length < 3) errors.push("Dirección inválida");
  if (!data.ciudad || data.ciudad.trim().length < 2) errors.push("Ciudad inválida");
  if (!data.telefono || !/^[0-9+()\-\s]+$/.test(data.telefono)) errors.push("Teléfono inválido");
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("Email inválido");
  if (!data.fechaNacimiento) errors.push("Fecha de nacimiento obligatoria");
  if (!data.estadoCivil) errors.push("Estado civil obligatorio");
  return errors;
}

async function enviarRegistro(registro, overwrite = false) {
  const resp = await fetch("/api/guardar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...registro, overwrite })
  });
  return resp.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const registro = {
    rut: document.getElementById("rut").value.trim(),
    nombres: document.getElementById("nombres").value.trim(),
    apellidos: document.getElementById("apellidos").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    ciudad: document.getElementById("ciudad").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    email: document.getElementById("email").value.trim(),
    fechaNacimiento: document.getElementById("fechaNacimiento").value,
    estadoCivil: document.getElementById("estadoCivil").value,
    comentarios: document.getElementById("comentarios").value.trim()
  };

  // validación cliente
  const errores = validarCliente(registro);
  if (errores.length) {
    alert("Errores:\n- " + errores.join("\n- "));
    return;
  }

  // Llamada initial sin overwrite
  try {
    const result = await enviarRegistro(registro, false);

    if (result.exists) {
      // pregunta al usuario si desea sobrescribir
      if (confirm("Registro con este RUT ya existe. ¿Desea sobrescribir?")) {
        const second = await enviarRegistro(registro, true);
        if (second.success) {
          alert(second.message);
          form.reset();
        } else {
          alert("Error: " + (second.message || JSON.stringify(second)));
        }
      } else {
        alert("No se sobrescribió el registro.");
      }
    } else if (result.success) {
      alert(result.message);
      form.reset();
    } else if (result.errors) {
      alert("Errores del servidor:\n- " + result.errors.join("\n- "));
    } else {
      alert("Respuesta inesperada: " + JSON.stringify(result));
    }
  } catch (err) {
    console.error(err);
    alert("Error de red o servidor. Revisa la consola del navegador y la consola del servidor.");
  }
});

limpiarBtn.addEventListener("click", () => form.reset());
cerrarBtn.addEventListener("click", () => {
  if (confirm("¿Desea cerrar / salir?")) window.close();
});

// Buscar
buscarBtn.addEventListener("click", async () => {
  const apellido = document.getElementById("buscarApellido").value.trim();
  resultadoBusqueda.innerHTML = "<li class='list-group-item'>Buscando...</li>";
  try {
    const resp = await fetch(`/api/buscar?apellido=${encodeURIComponent(apellido)}`);
    const data = await resp.json();
    resultadoBusqueda.innerHTML = "";
    if (data.length === 0) {
      resultadoBusqueda.innerHTML = "<li class='list-group-item'>No se encontraron registros</li>";
      return;
    }
    data.forEach(p => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `<strong>${p.nombres} ${p.apellidos}</strong> <br>
                      RUT: ${p.rut} • Ciudad: ${p.ciudad} • Tel: ${p.telefono} • Email: ${p.email}
                      <div class="mt-2">
                        <button class="btn btn-sm btn-outline-primary btn-edit">Cargar</button>
                      </div>`;
      // botón para cargar registro en el form para editar
      li.querySelector(".btn-edit").addEventListener("click", () => {
        document.getElementById("rut").value = p.rut;
        document.getElementById("nombres").value = p.nombres;
        document.getElementById("apellidos").value = p.apellidos;
        document.getElementById("direccion").value = p.direccion || "";
        document.getElementById("ciudad").value = p.ciudad;
        document.getElementById("telefono").value = p.telefono;
        document.getElementById("email").value = p.email;
        // convertir fecha (yyyy-mm-dd) a valor de input date
        document.getElementById("fechaNacimiento").value = p.fechaNacimiento ? p.fechaNacimiento.split('T')[0] : "";
        document.getElementById("estadoCivil").value = p.estadoCivil;
        document.getElementById("comentarios").value = p.comentarios || "";
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      resultadoBusqueda.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    resultadoBusqueda.innerHTML = "<li class='list-group-item text-danger'>Error en búsqueda</li>";
  }
});
