// Arreglo para almacenar los registros
let registros = JSON.parse(localStorage.getItem('registros')) || [];

// Referencias a los elementos del DOM
const guardarBtn = document.getElementById('guardarBtn');
const diaLibreBtn = document.getElementById('diaLibreBtn');
const exportarBtn = document.getElementById('exportarBtn');

// Asignación de eventos a los botones
guardarBtn.addEventListener('click', guardarRegistro);
diaLibreBtn.addEventListener('click', diaLibre);
exportarBtn.addEventListener('click', exportarCSV);

// Inicializar la tabla al cargar la página
actualizarTabla();

// Función para guardar o actualizar un registro
function guardarRegistro() {
    const fecha = document.getElementById('fecha').value;
    if (!fecha) {
        alert('Por favor, ingresa la fecha.');
        return;
    }

    const registro = {
        fecha,
        numeroConductor: document.getElementById('numeroConductor').value || '0',
        linea: document.getElementById('linea').value || '',
        numeroTurno: document.getElementById('numeroTurno').value || '0',
        horaInicio: document.getElementById('horaInicio').value || '00:00',
        horaFin: document.getElementById('horaFin').value || '00:00',
        loginExp: document.getElementById('loginExp').value || '00:00',
        logoutExp: document.getElementById('logoutExp').value || '00:00',
        numeroAutobus: document.getElementById('numeroAutobus').value || '0',
        totalViajeros: parseInt(document.getElementById('totalViajeros').value) || 0,
        billetesVendidos: parseInt(document.getElementById('billetesVendidos').value) || 0,
        observaciones: document.getElementById('observaciones').value || ''
    };

    // Cálculos automáticos
    registro.tiempoTotalHoja = calcularDiferenciaHoras(registro.horaInicio, registro.horaFin);
    registro.tiempoTotalOperativo = calcularDiferenciaHoras(registro.loginExp, registro.logoutExp);
    registro.excesoMinutos = calcularExcesoMinutos(registro.horaFin, registro.logoutExp);
    registro.liquidacionTotal = (registro.billetesVendidos * 1.30).toFixed(2);

    // Verificar si ya existe un registro para esa fecha
    const indice = registros.findIndex(r => r.fecha === fecha);
    if (indice >= 0) {
        registros[indice] = registro;
    } else {
        registros.push(registro);
    }

    // Guardar en localStorage
    localStorage.setItem('registros', JSON.stringify(registros));
    actualizarTabla();
    // document.getElementById('registroForm').reset(); // Comentada para mantener los datos
    actualizarCamposCalculados(); // Actualizar los campos calculados en el formulario
}

// Función para Día Libre
function diaLibre() {
    document.getElementById('registroForm').reset();
    document.getElementById('observaciones').value = 'DÍA LIBRE';

    // Asignar valores predeterminados
    document.getElementById('numeroConductor').value = '0';
    document.getElementById('linea').value = 'DÍA LIBRE';
    document.getElementById('numeroTurno').value = '0';
    document.getElementById('horaInicio').value = '00:00';
    document.getElementById('horaFin').value = '00:00';
    document.getElementById('loginExp').value = '00:00';
    document.getElementById('logoutExp').value = '00:00';
    document.getElementById('numeroAutobus').value = '0';
    document.getElementById('totalViajeros').value = 0;
    document.getElementById('billetesVendidos').value = 0;

    // Limpiar campos calculados
    document.getElementById('tiempoTotalHoja').value = '';
    document.getElementById('tiempoTotalOperativo').value = '';
    document.getElementById('excesoMinutos').value = '';
    document.getElementById('liquidacionTotal').value = '';
}

// Función para actualizar las tablas
function actualizarTabla() {
    const contenedorTablas = document.getElementById('tablasMensuales');
    contenedorTablas.innerHTML = '';

    let totalAnualTiempoHoja = 0;
    let totalAnualTiempoOperativo = 0;
    let totalAnualExcesoMinutos = 0;
    let totalAnualViajeros = 0;
    let totalAnualBilletesVendidos = 0;
    let totalAnualLiquidacion = 0;

    // Agrupar registros por mes y año
    const registrosPorMes = {};

    registros.forEach(registro => {
        const fechaRegistro = new Date(registro.fecha);
        const mes = fechaRegistro.getMonth(); // 0-11
        const año = fechaRegistro.getFullYear();
        const claveMes = `${año}-${mes}`;

        if (!registrosPorMes[claveMes]) {
            registrosPorMes[claveMes] = [];
        }

        registrosPorMes[claveMes].push(registro);

        // Acumulación de totales anuales
        const tiempoHojaMinutos = convertirATotalMinutos(registro.tiempoTotalHoja);
        const tiempoOperativoMinutos = convertirATotalMinutos(registro.tiempoTotalOperativo);
        const excesoMinutos = convertirATotalMinutos(registro.excesoMinutos);

        totalAnualTiempoHoja += tiempoHojaMinutos;
        totalAnualTiempoOperativo += tiempoOperativoMinutos;
        totalAnualExcesoMinutos += excesoMinutos;
        totalAnualViajeros += registro.totalViajeros;
        totalAnualBilletesVendidos += registro.billetesVendidos;
        totalAnualLiquidacion += parseFloat(registro.liquidacionTotal);
    });

    // Obtener las claves de los meses y ordenarlas de más reciente a más antiguo
    const mesesOrdenados = Object.keys(registrosPorMes).sort((a, b) => {
        const [añoA, mesA] = a.split('-').map(Number);
        const [añoB, mesB] = b.split('-').map(Number);
        const fechaA = new Date(añoA, mesA);
        const fechaB = new Date(añoB, mesB);
        return fechaB - fechaA; // Orden descendente
    });

    mesesOrdenados.forEach(claveMes => {
        const registrosMes = registrosPorMes[claveMes];

        // Calcular totales mensuales
        let totalMensualTiempoHoja = 0;
        let totalMensualTiempoOperativo = 0;
        let totalMensualExcesoMinutos = 0;
        let totalMensualViajeros = 0;
        let totalMensualBilletesVendidos = 0;
        let totalMensualLiquidacion = 0;

        registrosMes.forEach(registro => {
            const tiempoHojaMinutos = convertirATotalMinutos(registro.tiempoTotalHoja);
            const tiempoOperativoMinutos = convertirATotalMinutos(registro.tiempoTotalOperativo);
            const excesoMinutos = convertirATotalMinutos(registro.excesoMinutos);

            totalMensualTiempoHoja += tiempoHojaMinutos;
            totalMensualTiempoOperativo += tiempoOperativoMinutos;
            totalMensualExcesoMinutos += excesoMinutos;
            totalMensualViajeros += registro.totalViajeros;
            totalMensualBilletesVendidos += registro.billetesVendidos;
            totalMensualLiquidacion += parseFloat(registro.liquidacionTotal);
        });

        // Crear la tabla mensual
        const tablaMensual = document.createElement('div');
        tablaMensual.classList.add('monthly-table');

        const [año, mes] = claveMes.split('-').map(Number);
        const nombreMes = obtenerNombreMes(mes);

        tablaMensual.innerHTML = `
            <h2>${nombreMes} ${año}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>N° Conductor</th>
                        <th>Línea</th>
                        <th>N° Turno</th>
                        <th>Inicio (Hoja)</th>
                        <th>Fin (Hoja)</th>
                        <th>Tiempo Total Hoja</th>
                        <th>Login Exp</th>
                        <th>Logout Exp</th>
                        <th>Tiempo Total Operativo</th>
                        <th>Exceso de Minutos</th>
                        <th>N° Autobús</th>
                        <th>Total Viajeros</th>
                        <th>Billetes Vendidos</th>
                        <th>Liquidación Total (€)</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
                <tfoot>
                    <tr>
                        <td colspan="6">Total Mensual</td>
                        <td>${convertirAHorasMinutos(totalMensualTiempoHoja)}</td>
                        <td></td>
                        <td></td>
                        <td>${convertirAHorasMinutos(totalMensualTiempoOperativo)}</td>
                        <td>${convertirAHorasMinutos(totalMensualExcesoMinutos)}</td>
                        <td></td>
                        <td>${totalMensualViajeros}</td>
                        <td>${totalMensualBilletesVendidos}</td>
                        <td>${totalMensualLiquidacion.toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        `;

        const tbody = tablaMensual.querySelector('tbody');

        // Ordenar los registros del mes por fecha descendente (más reciente primero)
        registrosMes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        registrosMes.forEach(registro => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${registro.fecha}</td>
                <td>${registro.numeroConductor}</td>
                <td>${registro.linea}</td>
                <td>${registro.numeroTurno}</td>
                <td>${registro.horaInicio}</td>
                <td>${registro.horaFin}</td>
                <td>${registro.tiempoTotalHoja}</td>
                <td>${registro.loginExp}</td>
                <td>${registro.logoutExp}</td>
                <td>${registro.tiempoTotalOperativo}</td>
                <td>${registro.excesoMinutos}</td>
                <td>${registro.numeroAutobus}</td>
                <td>${registro.totalViajeros}</td>
                <td>${registro.billetesVendidos}</td>
                <td>${registro.liquidacionTotal}</td>
                <td>${registro.observaciones}</td>
            `;

            // Verificar si hay exceso de minutos
            if (registro.excesoMinutos !== '00:00') {
                const celdas = row.getElementsByTagName('td');
                const celdaExcesoMinutos = celdas[10];
                celdaExcesoMinutos.style.backgroundColor = 'yellow';
                celdaExcesoMinutos.style.fontWeight = 'bold';
            }

            tbody.appendChild(row);
        });

        // Añadir la tabla mensual al contenedor
        contenedorTablas.appendChild(tablaMensual);
    });

    // Actualizar totales anuales
    document.getElementById('totalAnualTiempoHoja').textContent = convertirAHorasMinutos(totalAnualTiempoHoja);
    document.getElementById('totalAnualTiempoOperativo').textContent = convertirAHorasMinutos(totalAnualTiempoOperativo);
    document.getElementById('totalAnualExcesoMinutos').textContent = convertirAHorasMinutos(totalAnualExcesoMinutos);
    document.getElementById('totalAnualViajeros').textContent = totalAnualViajeros;
    document.getElementById('totalAnualBilletesVendidos').textContent = totalAnualBilletesVendidos;
    document.getElementById('totalAnualLiquidacion').textContent = totalAnualLiquidacion.toFixed(2);
}

// Función para obtener el nombre del mes
function obtenerNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes];
}

// Función para calcular diferencia de horas
function calcularDiferenciaHoras(inicio, fin) {
    if (!inicio || !fin) return '00:00';
    const [inicioHoras, inicioMinutos] = inicio.split(':').map(Number);
    const [finHoras, finMinutos] = fin.split(':').map(Number);

    let inicioTotalMinutos = inicioHoras * 60 + inicioMinutos;
    let finTotalMinutos = finHoras * 60 + finMinutos;

    if (finTotalMinutos < inicioTotalMinutos) {
        finTotalMinutos += 1440; // Añade 24 horas si el fin es después de medianoche
    }

    const diff = finTotalMinutos - inicioTotalMinutos;
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;
    return `${pad(horas)}:${pad(minutos)}`;
}

// Función para calcular exceso de minutos
function calcularExcesoMinutos(horaFinHoja, logoutExp) {
    if (!horaFinHoja || !logoutExp) return '00:00';
    const [finHojaHoras, finHojaMinutos] = horaFinHoja.split(':').map(Number);
    const [logoutHoras, logoutMinutos] = logoutExp.split(':').map(Number);

    let finHojaTotalMinutos = finHojaHoras * 60 + finHojaMinutos;
    let logoutTotalMinutos = logoutHoras * 60 + logoutMinutos;

    let diff = logoutTotalMinutos - finHojaTotalMinutos;

    if (diff < -720) {
        // Si la diferencia es muy negativa, significa que el logout es después de medianoche
        logoutTotalMinutos += 1440; // Añade 24 horas
        diff = logoutTotalMinutos - finHojaTotalMinutos;
    }

    if (diff > 0) {
        const horas = Math.floor(diff / 60);
        const minutos = diff % 60;
        return `${pad(horas)}:${pad(minutos)}`;
    } else {
        return '00:00';
    }
}

// Función para agregar ceros a la izquierda
function pad(num) {
    return num.toString().padStart(2, '0');
}

// Funciones de conversión
function convertirATotalMinutos(horaMinuto) {
    if (!horaMinuto) return 0;
    const [horas, minutos] = horaMinuto.split(':').map(Number);
    return horas * 60 + minutos;
}

function convertirAHorasMinutos(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${pad(horas)}:${pad(minutos)}`;
}

// Función para actualizar los campos calculados en el formulario
function actualizarCamposCalculados() {
    // Obtener los valores actuales del formulario
    const horaInicio = document.getElementById('horaInicio').value || '00:00';
    const horaFin = document.getElementById('horaFin').value || '00:00';
    const loginExp = document.getElementById('loginExp').value || '00:00';
    const logoutExp = document.getElementById('logoutExp').value || '00:00';
    const billetesVendidos = parseInt(document.getElementById('billetesVendidos').value) || 0;

    // Recalcular los campos
    const tiempoTotalHoja = calcularDiferenciaHoras(horaInicio, horaFin);
    const tiempoTotalOperativo = calcularDiferenciaHoras(loginExp, logoutExp);
    const excesoMinutos = calcularExcesoMinutos(horaFin, logoutExp);
    const liquidacionTotal = (billetesVendidos * 1.30).toFixed(2);

    // Actualizar los campos en el formulario
    document.getElementById('tiempoTotalHoja').value = tiempoTotalHoja;
    document.getElementById('tiempoTotalOperativo').value = tiempoTotalOperativo;
    document.getElementById('excesoMinutos').value = excesoMinutos;
    document.getElementById('liquidacionTotal').value = liquidacionTotal;
}

// Función para exportar a CSV
function exportarCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Número de Conductor,Línea,Número de Turno,Hora Inicio Hoja,Hora Fin Hoja,Tiempo Total Hoja,Login Exp,Logout Exp,Tiempo Total Operativo,Exceso de Minutos,Número de Autobús,Número Total de Viajeros,Número de Billetes Vendidos,Liquidación Total (€),Observaciones\n";

    // Ordenar registros antes de exportar (más reciente primero)
    registros.sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaB - fechaA;
    });

    registros.forEach(registro => {
        const row = [
            registro.fecha,
            registro.numeroConductor,
            registro.linea,
            registro.numeroTurno,
            registro.horaInicio,
            registro.horaFin,
            registro.tiempoTotalHoja,
            registro.loginExp,
            registro.logoutExp,
            registro.tiempoTotalOperativo,
            registro.excesoMinutos,
            registro.numeroAutobus,
            registro.totalViajeros,
            registro.billetesVendidos,
            registro.liquidacionTotal,
            registro.observaciones
        ].join(",");
        csvContent += row + "\n";
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "registros.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Escuchar cambios en los campos relevantes para actualizar los cálculos en tiempo real (opcional)
const camposParaEscuchar = ['horaInicio', 'horaFin', 'loginExp', 'logoutExp', 'billetesVendidos'];
camposParaEscuchar.forEach(campoId => {
    document.getElementById(campoId).addEventListener('input', actualizarCamposCalculados);
});
