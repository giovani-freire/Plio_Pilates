const supabaseUrl = 'https://pskptinpymkfnawizxrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza3B0aW5weW1rZm5hd2l6eHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjM4MTEsImV4cCI6MjA5MzczOTgxMX0.xwjsHKViWh8sqaaZYpvuslxa-vrb2yPzTSvcVm_5pKo';

const supabase = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

document
  .querySelector('.btn-submit')
  .addEventListener('click', async () => {

    const dados = {

      nome: document.getElementById('nome').value,
      email: document.getElementById('email').value,
      telefone: document.getElementById('telefone').value,
      unidade: document.getElementById('unidade').value,
      mensagem: document.getElementById('mensagem').value

    };

    const { error } = await supabase
      .from('agendamentos')
      .insert([dados]);

    if (error) {
      alert('Erro ao enviar');
      return;
    }

    alert('Solicitação enviada com sucesso');

});