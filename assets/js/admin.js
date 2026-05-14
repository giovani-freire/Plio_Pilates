const supabaseUrl =
  'https://pskptinpymkfnawizxrj.supabase.co';

const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza3B0aW5weW1rZm5hd2l6eHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjM4MTEsImV4cCI6MjA5MzczOTgxMX0.xwjsHKViWh8sqaaZYpvuslxa-vrb2yPzTSvcVm_5pKo';

const supabaseClient =
  window.supabase.createClient(
    supabaseUrl,
    supabaseKey
  );

/* ===========================
   Chart
=========================== */

let statusChart;

/* ===========================
   Login Verification
=========================== */

async function verificarLogin() {

  const { data } =
    await supabaseClient.auth.getSession();

  if (!data.session) {

    window.location.href =
      'login.html';

    return;
  }

  carregarAgendamentos();
}

/* ===========================
   Auto Expire Appointments
=========================== */

async function expirarAgendamentos() {

  const agora =
    new Date();

  const { data, error } =
    await supabaseClient
      .from('agendamentos')
      .select('*')
      .eq('status', 'aberto');

  if (error) {

    console.error(error);

    return;
  }

  for (const item of data) {

    if (
      !item.data ||
      !item.horario
    ) continue;

    const dataHoraAgendamento =
      new Date(
        `${item.data}T${item.horario}`
      );

    /* ===========================
       Expira apenas se:
       - estiver aberto
       - horário já passou
    =========================== */

    if (
      dataHoraAgendamento.getTime() <
      agora.getTime()
    ) {

      await supabaseClient
        .from('agendamentos')
        .update({

          status:
            'negado',

          atualizado_em:
            new Date().toISOString()

        })
        .eq('id', item.id);
    }
  }
}

/* ===========================
   Load Appointments
=========================== */

async function carregarAgendamentos() {

  await expirarAgendamentos();

  const filtro =
    document.getElementById(
      'filtroStatus'
    ).value;

  const periodo =
    document.getElementById(
      'filtroPeriodo'
    ).value;

  const dataSelecionada =
    document.getElementById(
      'filtroData'
    ).value;

  const inputData =
    document.getElementById(
      'filtroData'
    );

  /* ===========================
     Show / Hide Date Input
  =========================== */

  if (periodo === 'data') {

    inputData.style.display =
      'block';

  } else {

    inputData.style.display =
      'none';
  }

  /* ===========================
     Base Query
  =========================== */

  let query =
    supabaseClient
      .from('agendamentos')
      .select('*')
      .order('criado_em', {
        ascending: false
      });

  /* ===========================
     Status Filter
  =========================== */

  if (filtro !== 'todos') {

    query =
      query.eq(
        'status',
        filtro
      );
  }

  /* ===========================
     Period Filters
  =========================== */

  const hoje =
    new Date();

  if (periodo === 'hoje') {

    const inicioHoje =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
      ).toISOString();

    query =
      query.gte(
        'criado_em',
        inicioHoje
      );
  }

  if (periodo === '7dias') {

    const seteDias =
      new Date();

    seteDias.setDate(
      hoje.getDate() - 7
    );

    query =
      query.gte(
        'criado_em',
        seteDias.toISOString()
      );
  }

  if (periodo === 'mes') {

    const inicioMes =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
      ).toISOString();

    query =
      query.gte(
        'criado_em',
        inicioMes
      );
  }

  if (
    periodo === 'data' &&
    dataSelecionada
  ) {

    const inicio =
      new Date(
        dataSelecionada
      );

    const fim =
      new Date(
        dataSelecionada
      );

    fim.setDate(
      fim.getDate() + 1
    );

    query =
      query
        .gte(
          'criado_em',
          inicio.toISOString()
        )
        .lt(
          'criado_em',
          fim.toISOString()
        );
  }

  /* ===========================
     Execute Query
  =========================== */

  const { data, error } =
    await query;

  if (error) {

    console.error(error);

    return;
  }

  /* ===========================
     Metrics
  =========================== */

  const total =
    data.length;

  const abertos =
    data.filter(
      item =>
        item.status === 'aberto'
    ).length;

  const aceitos =
    data.filter(
      item =>
        item.status === 'aceito'
    ).length;

  const negados =
    data.filter(
      item =>
        item.status === 'negado'
    ).length;

  document.getElementById(
    'totalAgendamentos'
  ).innerText = total;

  document.getElementById(
    'totalAbertos'
  ).innerText = abertos;

  document.getElementById(
    'totalAceitos'
  ).innerText = aceitos;

  document.getElementById(
    'totalNegados'
  ).innerText = negados;

  /* ===========================
     Chart
  =========================== */

  renderizarGrafico(
    abertos,
    aceitos,
    negados
  );

  /* ===========================
     Cards
  =========================== */

  const container =
    document.getElementById(
      'agendamentos'
    );

  container.innerHTML = '';

  data.forEach(item => {

    container.innerHTML += `

      <div class="card">

        <h3>
          ${item.nome}
        </h3>

        <p>
          <strong>E-mail:</strong>
          ${item.email}
        </p>

        <p>
          <strong>Telefone:</strong>
          ${item.telefone}
        </p>

        <p>
          <strong>Unidade:</strong>
          ${item.unidade}
        </p>

        <p>
          <strong>Data:</strong>
          ${item.data || '—'}
        </p>

        <p>
          <strong>Horário:</strong>
          ${item.horario || '—'}
        </p>

        <p>
          <strong>Mensagem:</strong>
          ${item.mensagem || '—'}
        </p>

        <div class="status ${item.status}">
          ${item.status}
        </div>

        ${item.status === 'aberto' ? `

          <div class="card-actions">

            <button
              class="btn btn-accept"
              onclick="atualizarStatus(${item.id}, 'aceito')">

              Aceitar

            </button>

            <button
              class="btn btn-deny"
              onclick="atualizarStatus(${item.id}, 'negado')">

              Negar

            </button>

          </div>

        ` : ''}

      </div>

    `;
  });
}

/* ===========================
   Update Status
=========================== */

async function atualizarStatus(
  id,
  status
) {

  const { error } =
    await supabaseClient
      .from('agendamentos')
      .update({

        status:
          status,

        atualizado_em:
          new Date().toISOString()

      })
      .eq('id', id);

  if (error) {

    console.error(error);

    Swal.fire({

      icon:
        'error',

      title:
        'Erro',

      text:
        'Não foi possível atualizar.'
    });

    return;
  }

  Swal.fire({

    icon:
      'success',

    title:
      'Status atualizado',

    text:
      `Agendamento ${status}.`
  });

  carregarAgendamentos();
}

/* ===========================
   Chart Render
=========================== */

function renderizarGrafico(
  abertos,
  aceitos,
  negados
) {

  const ctx =
    document.getElementById(
      'statusChart'
    );

  if (statusChart) {

    statusChart.destroy();
  }

  statusChart =
    new Chart(ctx, {

      type:
        'doughnut',

      data: {

        labels: [
          'Abertos',
          'Aceitos',
          'Negados'
        ],

        datasets: [{

          data: [
            abertos,
            aceitos,
            negados
          ],

          backgroundColor: [
            '#f4c542',
            '#34bb90',
            '#e25b5b'
          ],

          borderWidth:
            0
        }]
      },

      options: {

        responsive:
          true,

        maintainAspectRatio:
          false,

        cutout:
          '70%',

        plugins: {

          legend: {

            position:
              'bottom',

            labels: {

              font: {

                family:
                  'Segoe UI',

                size:
                  13,

                weight:
                  '600'
              },

              padding:
                18
            }
          }
        }
      }
    });
}

/* ===========================
   Logout
=========================== */

async function logout() {

  await supabaseClient.auth.signOut();

  window.location.href =
    'login.html';
}

/* ===========================
   Init
=========================== */

verificarLogin();