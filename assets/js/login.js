const supabaseUrl = 'https://pskptinpymkfnawizxrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza3B0aW5weW1rZm5hd2l6eHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjM4MTEsImV4cCI6MjA5MzczOTgxMX0.xwjsHKViWh8sqaaZYpvuslxa-vrb2yPzTSvcVm_5pKo';

const supabaseClient = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);

async function login() {

    const email =
        document.getElementById('email').value;

    const senha =
        document.getElementById('senha').value;

    const { error } =
        await supabaseClient.auth.signInWithPassword({

            email,
            password: senha

        });

    if (error) {

        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Credenciais inválidas.'
        });

        return;
    }

    window.location.href = 'admin.html';
}