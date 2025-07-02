import React, { useState } from "react";

interface RejectPostViewProps {
  postId: number;
  backendUrl?: string;
  onClose: () => void;
  onRejected?: (id: number) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
}

const RejectPostView: React.FC<RejectPostViewProps> = ({
  postId,
  backendUrl,
  onClose,
  onRejected,
  showNotification,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReject = async () => {
    if (!postId || !reason.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${backendUrl}/api/posts/${postId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        showNotification('success', 'The post was rejected.');
        onRejected?.(postId); // obaveštavamo parent da izbaci post iz liste
        onClose();
      } else {
        showNotification('error', 'An error occurred while rejecting.');
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      showNotification('error', 'Error connecting to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reject-post-section">
      <div className="w-layout-blockcontainer container w-container">
        <div className="reject-post-wrapper">
          <div className="form-block-4 w-form">
            <form
              className="form-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!submitting) handleReject();
              }}
            >
              <div className="text-block-35">Reason for post rejection</div>
              <textarea
                placeholder="Enter reject reason"
                maxLength={5000}
                className="textarea-3 w-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <div className="div-block-17">
                <a
                  className="button-6 w-button"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                  }}
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  className="button-5 w-button"
                  disabled={submitting}
                >
                  {submitting ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RejectPostView;
