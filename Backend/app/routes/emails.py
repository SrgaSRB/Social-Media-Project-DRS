import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
import threading

def send_email(sender_email: str, sender_password: str, recipient: str, subject: str, message: str, smtp_server: str, smtp_port: int):
    """
    Function to send an email.

    :param sender_email: The email address of the sender.
    :param sender_password: The password or app-specific password of the sender's email.
    :param recipients: List of recipient email addresses.
    :param subject: The subject of the email.
    :param message: The body of the email.
    :param smtp_server: SMTP server address.
    :param smtp_port: SMTP server port.
    """
    try:
        # Create a MIME multipart message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient
        msg['Subject'] = subject

        # Attach the message body

        msg.attach(MIMEText(message, 'plain'))
        # Establish a connection to the SMTP server
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Secure the connection
            server.login(sender_email, sender_password)  # Log in to the server
            server.sendmail(sender_email, recipient, msg.as_string())  # Send the email

        print(f"Email sent successfully to recipient.")

    except Exception as e:
        print(f"Failed to send email: {e}")


def send_email_in_thread(sender_email: str, sender_password: str, recipients: str, subject: str, message: str, smtp_server: str, smtp_port: int):
    """
    Wrapper to send email in a separate thread.
    """
    thread = threading.Thread(
        target=send_email, 
        args=(sender_email, sender_password, recipients, subject, message, smtp_server, smtp_port)
    )
    thread.start()