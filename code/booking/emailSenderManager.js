const nodemailer = require("nodemailer");

class EmailSenderManager {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      const emailConfig = {
        host: process.env.SMTP_HOST || 'apartments-sibenik.com',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: true, // Use SSL for port 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Add additional options for better compatibility
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000 // 60 seconds
      };

      this.transporter = nodemailer.createTransport(emailConfig);
    } catch (error) {
      console.error('Error initializing email transporter:', error);
    }
  }

  // Format date to Croatian format (dd.mm.yyyy.)
  formatDate(date) {
    return new Date(date).toLocaleDateString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Format timestamp to Croatian format
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // Get apartment type for email subject
  getApartmentType(apartmentName) {
    const apartmentTypes = {
      'Studio Apartment': 'studio',
      'Apartment with Garden': 'veliki',
      'Room Apartment': 'soba'
    };
    return apartmentTypes[apartmentName] || 'nepoznat';
  }

  // Create email subject
  createEmailSubject(apartmentName) {
    const currentDate = this.formatDate(new Date());
    const apartmentType = this.getApartmentType(apartmentName);
    return `${currentDate} - NOVI UPIT - ${apartmentType}`.toUpperCase();
  }

  // Create plain text email body
  createEmailBody(reservationData, collisionData = null) {
    const checkInFormatted = this.formatDate(reservationData.checkIn);
    const checkOutFormatted = this.formatDate(reservationData.checkOut);
    const timestampFormatted = this.formatTimestamp(reservationData.timestamp);

    let body = `
Full name: ${reservationData.fullName}
Email: ${reservationData.email || 'N/A'}
Phone: ${reservationData.phone}
Apartment: ${reservationData.apartment}
Dates: ${checkInFormatted} - ${checkOutFormatted}
Message: ${reservationData.message || 'N/A'}

DETAILS:
form_req_id: ${reservationData.id}
req_timestamp: ${timestampFormatted}
status: ${reservationData.status}`;

    if (collisionData) {
      body += `

RESERVATION COLLISION:
REQUESTED EVENT DATES: ${this.formatDate(collisionData.requestedStart)} - ${this.formatDate(collisionData.requestedEnd)}
EXISTING EVENT DATES: ${this.formatDate(collisionData.existingStart)} - ${this.formatDate(collisionData.existingEnd)}
FOR ${reservationData.apartment}
existing_event_id: ${collisionData.existingEventId}`;
    }

    return body.trim();
  }

  // Create HTML email body
  createEmailHTML(reservationData, collisionData = null) {
    const checkInFormatted = this.formatDate(reservationData.checkIn);
    const checkOutFormatted = this.formatDate(reservationData.checkOut);
    const timestampFormatted = this.formatTimestamp(reservationData.timestamp);
    const durationNights = Math.ceil((new Date(reservationData.checkOut) - new Date(reservationData.checkIn)) / (1000 * 60 * 60 * 24));

    let collisionSection = '';
    if (collisionData) {
      collisionSection = `
        <div style="background: #ff9500; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ff6b00;">
          <h3 style="color: #000; margin-top: 0; font-weight: bold;">RESERVATION COLLISION</h3>
          <p style="color: #000; font-weight: bold;"><strong>REQUESTED EVENT DATES:</strong> ${this.formatDate(collisionData.requestedStart)} - ${this.formatDate(collisionData.requestedEnd)}</p>
          <p style="color: #000; font-weight: bold;"><strong>EXISTING EVENT DATES:</strong> ${this.formatDate(collisionData.existingStart)} - ${this.formatDate(collisionData.existingEnd)}</p>
          <p style="color: #000; font-weight: bold;"><strong>FOR</strong> <em>${reservationData.apartment}</em></p>
          <p style="color: #000; font-weight: bold;"><strong>existing_event_id:</strong> ${collisionData.existingEventId}</p>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            New Reservation Request
          </h2>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #34495e; margin-top: 0;">Guest Information</h3>
            <p><strong>Full name:</strong> ${reservationData.fullName}</p>
            <p><strong>Email:</strong> ${reservationData.email || 'N/A'}</p>
            <p><strong>Phone:</strong> <a href="tel:${reservationData.phone}" style="color: #3498db; text-decoration: none;">${reservationData.phone}</a></p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #34495e; margin-top: 0;">Reservation Details</h3>
            <p><strong>Apartment:</strong> ${reservationData.apartment}</p>
            <p><strong>Dates:</strong> ${checkInFormatted} - ${checkOutFormatted}</p>
            <p><strong>Duration:</strong> ${durationNights} nights</p>
          </div>
          
          ${collisionSection}
          
          ${reservationData.message ? `
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Message</h3>
              <p style="white-space: pre-wrap; font-style: italic;">${reservationData.message}</p>
            </div>
          ` : ''}
          
          <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3498db;">
            <h3 style="color: #2c3e50; margin-top: 0;">Technical Details</h3>
            <p><strong>form_req_id:</strong> ${reservationData.id}</p>
            <p><strong>req_timestamp:</strong> ${timestampFormatted}</p>
            <p><strong>status:</strong> ${reservationData.status}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Send reservation email
  async sendReservationEmail(reservationData, collisionData = null) {
    try {
      if (!this.transporter) {
        console.error('Email transporter not initialized');
        return false;
      }

      const subject = this.createEmailSubject(reservationData.apartment);
      const textBody = this.createEmailBody(reservationData, collisionData);
      const htmlBody = this.createEmailHTML(reservationData, collisionData);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: 'reservations@apartments-sibenik.com',
        subject: subject,
        text: textBody,
        html: htmlBody
      };

      // Add timeout to email sending
      const sendPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email send timeout')), 30000); // 30 second timeout
      });

      const result = await Promise.race([sendPromise, timeoutPromise]);
      console.log('Reservation email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending reservation email:', error);
      return false;
    }
  }

  // Test email connection
  async testConnection() {
    try {
      if (!this.transporter) {
        console.error('Email transporter not initialized');
        return false;
      }

      // Add timeout to prevent hanging
      const connectionPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000); // 10 second timeout
      });

      await Promise.race([connectionPromise, timeoutPromise]);
      console.log('Email server connection successful');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailSenderManager();
