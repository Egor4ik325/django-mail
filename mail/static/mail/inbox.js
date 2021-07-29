document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('form').onsubmit = () => {
    // POST /emails to send email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        // Put all form fields inside request body
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.getElementById('compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
      .then(response => response.json())
      .then(result => {
        // Log server JSON response
        console.log(result);
        // Render sent emails
        load_mailbox('sent');
      }, reject => {
        console.log(reject);
      })

    return false;
  }

}

// Request and render mailbox (inbox, sent, archived)
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Log inbox response object
      console.log(mailbox, emails);

      // Check empty response
      if (emails.length === 0) {
        const msg = document.createElement('p');
        msg.innerText = `No emails in ${mailbox} mailbox.`;
        document.querySelector('#emails-view').append(msg);
        return;
      }

      // Render emails
      emails.forEach(email => {
        const email_div = document.createElement('div');
        document.querySelector('#emails-view').append(email_div);

        // CSS styling
        email_div.classList = [`${mailbox}-email`];
        email_div.style.border = '1px solid black';
        email_div.style.borderRadius = '5px';
        if (!email.read) {
          email_div.style.backgroundColor = 'lightgray';
        } else {
          email_div.style.backgroundColor = 'white';
        }

        // Content rendering
        let email_address;
        if (mailbox === 'inbox' || mailbox === 'archive') {
          email_address = `From ${email.sender.bold()}`;
        } else if (mailbox === 'sent') {
          email_address = `To ${email.recipients.toString().bold()}`
        }
        [date, time] = email.timestamp.split(',');
        const email_line = document.createElement('div');
        email_div.append(email_line);
        email_line.innerHTML = `<span>${email_address} "${email.subject}"</span><span> on <i>${date}</i> at <i>${time}</i></span>`;

        // Events
        email_line.addEventListener('click', () => { renderEmail(email.id) });

        // Email controls
        const controls = document.createElement('div');
        email_div.append(controls);

        if (mailbox === 'inbox' || mailbox === 'archive') {
          // Reply control button
          const reply_button = document.createElement('button');
          controls.append(reply_button);
          reply_button.innerText = 'Reply';
          reply_button.classList = 'btn btn-primary'
          reply_button.onclick = () => reply(email.id);

          // Archive control button
          const archive_button = document.createElement('button');
          controls.append(archive_button);
          archive_button.innerText = email.archived ? 'Unarchive' : 'Archive';
          archive_button.classList = ['btn btn-secondary']
          archive_button.onclick = () => {
            switchArchived(email.id);
            load_mailbox('inbox');
          }
        }
      });
    })
}

function renderEmail(email_id) {
  // Display/hide proper pages
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Put email as read
  fetch(`emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    })
  })

  // Get full email
  fetch(`emails/${email_id}`)
    .then((response) => { return response.json(); })
    .then(email => {
      // Render email
      const email_html = document.querySelector('#email-view');
      email_html.innerHTML =
        `<h1>${email.subject}</h1>
        <p>${email.sender.bold()} on ${email.timestamp.small()}</p>
        <p>${email.body}</p>`;
    });
}

// Switch email archived state
function switchArchived(email_id) {
  // Get email archived state
  fetch(`emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      // Put inserved archived state
      fetch(`emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !email.archived,
        })
      })
    })
}

function reply(email_id) {
  // Get recived email
  fetch(`emails/${email_id}`)
    .then(response => response.json())
    .then(recived_email => {
      // Load compose
      compose_email()

      // Prefill compose form fields
      document.querySelector('#compose-recipients').value = recived_email.sender;
      if (recived_email.subject.startsWith('Re:')) {
        document.querySelector('#compose-subject').value = recived_email.subject;
      } else {
        document.querySelector('#compose-subject').value = 'Re: '.concat(recived_email.subject);
      }
      document.querySelector('#compose-body').value = `On ${recived_email.timestamp} ${recived_email.sender} wrote:\n${recived_email.body}`;
    })

  'sdfkjs'.startsWith('Re:')
}