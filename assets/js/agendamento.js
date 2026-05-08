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

form.addEventListener('submit', async (event) => {

    event.preventDefault();

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
        mensagem: document.getElementById('mensagem').value

    };

    const { error } = await supabaseClient
        .from('agendamentos')
        .insert([dados]);

    btn.disabled = false;
    btn.innerText = 'Enviar solicitação';

    if (error) {

        console.error(error);

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