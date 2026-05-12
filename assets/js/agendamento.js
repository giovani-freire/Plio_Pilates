const supabaseUrl = 'https://pskptinpymkfnawizxrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza3B0aW5weW1rZm5hd2l6eHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjM4MTEsImV4cCI6MjA5MzczOTgxMX0.xwjsHKViWh8sqaaZYpvuslxa-vrb2yPzTSvcVm_5pKo';

const supabaseClient = supabase.createClient(
    supabaseUrl,
    supabaseKey
);

const telefoneInput = document.getElementById('telefone');

IMask(telefoneInput, {
    mask: '(00) 00000-0000'
});

const form = document.getElementById('form-agendamento');
const dataInput = document.getElementById('data');
const horarioInput = document.getElementById('horario');
const unidadeInput = document.getElementById('unidade');
const horarioRadios = document.getElementById('horario-radios');

// Definição dos horários por unidade e tipo de dia
const horarios = {
    pinheiros: {
        semana: { inicio: 6, fim: 21 }, // 6h a 21h
        sabado: { inicio: 8, fim: 14 }  // 8h a 14h
    },
    itaim: {
        semana: { inicio: 6.5, fim: 21 }, // 6:30 a 21h
        sabado: { inicio: 8, fim: 13 }   // 8h a 13h
    }
};

// Função para gerar horários
function gerarHorarios(unidade, isSabado) {
    const config = horarios[unidade][isSabado ? 'sabado' : 'semana'];
    const lista = [];
    for (let h = config.inicio; h <= config.fim; h += 1) {
        const hora = Math.floor(h);
        const minuto = (h % 1) * 60;
        const time = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        lista.push(time);
    }
    return lista;
}

// Função para atualizar radio buttons
function atualizarHorarios() {
    const unidade = unidadeInput.value;
    const data = dataInput.value;
    if (!unidade || !data) {
        horarioRadios.innerHTML = '<p>Selecione unidade e data primeiro.</p>';
        horarioInput.value = '';
        return;
    }
    const isSabado = new Date(data).getDay() === 6;
    const listaHorarios = gerarHorarios(unidade, isSabado);
    horarioRadios.innerHTML = '';
    listaHorarios.forEach(time => {
        const label = document.createElement('label');
        label.className = 'radio-label';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'horario-radio';
        radio.value = time;
        radio.required = true;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(time));
        horarioRadios.appendChild(label);
    });
    // Reset hidden input
    horarioInput.value = '';
}

// Event listeners
unidadeInput.addEventListener('change', atualizarHorarios);
dataInput.addEventListener('change', () => {
    if (validarDataMinima()) {
        atualizarHorarios();
    }
});

// Listener para radio change
horarioRadios.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
        horarioInput.value = e.target.value;
    }
});

// Função para validar data mínima
function validarDataMinima() {
    const dataSelecionada = new Date(dataInput.value);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar só datas

    if (dataSelecionada < hoje) {
        dataInput.classList.add('error');
        Swal.fire({
            icon: 'warning',
            title: 'Data inválida',
            text: 'Selecione uma data futura.',
            didOpen: () => dataInput.focus()
        });
        dataInput.value = '';
        atualizarHorarios(); // Limpar horários
        return false;
    }
    dataInput.classList.remove('error');
    return true;
}

// Função para validar horário duplicado
async function validarHorarioDisponivel() {
    const data = dataInput.value;
    const horario = horarioInput.value;
    const unidade = unidadeInput.value;

    if (!data || !horario || !unidade) {
        return true; // Deixa passar se campos vazios
    }

    try {
        const { data: agendamentos, error } = await supabaseClient
            .from('agendamentos')
            .select('id')
            .eq('unidade', unidade)
            .eq('data', data)
            .eq('horario', horario);

        if (error) throw error;

        if (agendamentos.length > 0) {
            horarioInput.classList.add('error');
            
            Swal.fire({
                icon: 'warning',
                title: 'Horário indisponível',
                text: 'Este horário já foi reservado. Escolha outro horário ou data.',
                didOpen: () => horarioInput.focus()
            });
            
            return false;
        }

        horarioInput.classList.remove('error');
        return true;

    } catch (error) {
        console.error('Erro ao validar horário:', error);
        return true; // Deixa passar em caso de erro
    }
}

// Listener para validação em tempo real
horarioInput.addEventListener('change', validarHorarioDisponivel);
dataInput.addEventListener('change', validarHorarioDisponivel);
unidadeInput.addEventListener('change', validarHorarioDisponivel);

form.addEventListener('submit', async (event) => {

    event.preventDefault();

    // Validação final de horário antes de enviar
    const isHorarioValido = await validarHorarioDisponivel();
    if (!isHorarioValido) {
        return;
    }

    const btn = document.querySelector('.btn-submit');

    btn.disabled = true;
    btn.innerText = 'Enviando...';

    const dados = {

        nome: document.getElementById('nome').value,
        email: document
            .getElementById('email')
            .value
            .trim()
            .toLowerCase(),
        telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
        unidade: document.getElementById('unidade').value,
        data: document.getElementById('data').value,
        horario: document.getElementById('horario').value,
        mensagem: document.getElementById('mensagem').value

    };

    const { error } = await supabaseClient
        .from('agendamentos')
        .insert([dados]);

    btn.disabled = false;
    btn.innerText = 'Enviar solicitação';

    if (error) {

        console.error(error);

        // Verifica qual tipo de erro de constraint é
        if (
            error.message.includes('unico_horario_unidade') ||
            (error.message.includes('duplicate key') && error.message.includes('data') && error.message.includes('horario'))
        ) {

            Swal.fire({
                icon: 'warning',
                title: 'Horário indisponível',
                text: 'Já existe uma aula experimental marcada para esta unidade, data e horário. Escolha outro horário ou data.'
            });

            return;
        }

        if (
            error.message.includes('duplicate key') ||
            error.message.includes('email_unico')
        ) {

            Swal.fire({
                icon: 'warning',
                title: 'Solicitação já enviada',
                text: 'Este e-mail já possui um agendamento registrado.'
            });

            return;
        }

        Swal.fire({
            icon: 'error',
            title: 'Erro ao enviar',
            text: 'Tente novamente em alguns instantes.'
        });

        return;
    }

    Swal.fire({
        icon: 'success',
        title: 'Solicitação enviada!',
        text: 'Nossa equipe entrará em contato em breve.',
        confirmButtonText: 'Perfeito'
    });
    form.reset();

});