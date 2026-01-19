import { DeviationRecord, WorkflowStatus } from '../types';

export interface AdaptiveCardPayload {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: {
      type: 'AdaptiveCard';
      version: '1.4';
      body: any[];
      actions: any[];
    };
  }>;
}

export interface SlackBlockKitPayload {
  blocks: any[];
}

export interface CardActionResponse {
  actionId: string;
  action: 'approve' | 'reject';
  comment?: string;
  approver: string;
  timestamp: string;
}

/**
 * AdaptiveCardsService generates interactive cards for Microsoft Teams and Slack
 * that allow executives to approve/reject deviations directly from chat interfaces.
 */
export class AdaptiveCardsService {
  /**
   * Generates a Microsoft Teams Adaptive Card for approval
   */
  generateTeamsCard(
    deviation: DeviationRecord,
    approver: string,
    stepId: string
  ): AdaptiveCardPayload {
    const highestRPN = deviation.risks.length > 0
      ? Math.max(...deviation.risks.map(r => r.rpn))
      : 0;

    const isUrgent = highestRPN >= 125;
    const statusColor = isUrgent ? 'Attention' : 'Good';

    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'Container',
                style: 'emphasis',
                items: [
                  {
                    type: 'TextBlock',
                    text: '🔔 Supplier Deviation Approval Request',
                    weight: 'Bolder',
                    size: 'Large',
                    color: 'Accent',
                  },
                ],
              },
              {
                type: 'ColumnSet',
                columns: [
                  {
                    type: 'Column',
                    width: 'stretch',
                    items: [
                      {
                        type: 'TextBlock',
                        text: `**Deviation ID:** ${deviation.id}`,
                        wrap: true,
                      },
                      {
                        type: 'TextBlock',
                        text: `**Material:** ${deviation.masterData.materialNo || 'N/A'}`,
                        wrap: true,
                        spacing: 'Small',
                      },
                      {
                        type: 'TextBlock',
                        text: `**Supplier:** ${deviation.masterData.supplierName || 'N/A'}`,
                        wrap: true,
                        spacing: 'Small',
                      },
                    ],
                  },
                  {
                    type: 'Column',
                    width: 'auto',
                    items: [
                      {
                        type: 'FactSet',
                        facts: [
                          {
                            title: 'Status',
                            value: deviation.status,
                          },
                          {
                            title: 'Highest RPN',
                            value: highestRPN > 0 ? String(highestRPN) : 'N/A',
                          },
                          {
                            title: 'Urgency',
                            value: isUrgent ? '🔴 Critical' : '🟢 Normal',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: 'TextBlock',
                text: `**Description:** ${deviation.masterData.description || deviation.details.deviation || 'No description provided'}`,
                wrap: true,
                spacing: 'Medium',
              },
              {
                type: 'Input.Text',
                id: 'comment',
                placeholder: 'Add your comment (optional)',
                isMultiline: true,
                maxLength: 500,
                label: 'Comment',
              },
            ],
            actions: [
              {
                type: 'Action.Submit',
                title: '✅ Approve',
                style: 'positive',
                data: {
                  actionId: stepId,
                  action: 'approve',
                  deviationId: deviation.id,
                  approver: approver,
                },
              },
              {
                type: 'Action.Submit',
                title: '❌ Reject',
                style: 'destructive',
                data: {
                  actionId: stepId,
                  action: 'reject',
                  deviationId: deviation.id,
                  approver: approver,
                },
              },
            ],
          },
        },
      ],
    };
  }

  /**
   * Generates a Slack Block Kit payload for approval
   */
  generateSlackCard(
    deviation: DeviationRecord,
    approver: string,
    stepId: string
  ): SlackBlockKitPayload {
    const highestRPN = deviation.risks.length > 0
      ? Math.max(...deviation.risks.map(r => r.rpn))
      : 0;

    const isUrgent = highestRPN >= 125;

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Supplier Deviation Approval Request',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Deviation ID:*\n${deviation.id}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${deviation.status}`,
            },
            {
              type: 'mrkdwn',
              text: `*Material:*\n${deviation.masterData.materialNo || 'N/A'}`,
            },
            {
              type: 'mrkdwn',
              text: `*Highest RPN:*\n${highestRPN > 0 ? String(highestRPN) : 'N/A'} ${isUrgent ? '🔴' : '🟢'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description:*\n${deviation.masterData.description || deviation.details.deviation || 'No description provided'}`,
          },
        },
        {
          type: 'input',
          block_id: 'comment_block',
          element: {
            type: 'plain_text_input',
            action_id: 'comment',
            placeholder: {
              type: 'plain_text',
              text: 'Add your comment (optional)',
            },
            multiline: true,
            max_length: 500,
          },
          label: {
            type: 'plain_text',
            text: 'Comment',
          },
        },
        {
          type: 'actions',
          block_id: 'approval_actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✅ Approve',
                emoji: true,
              },
              style: 'primary',
              value: JSON.stringify({
                actionId: stepId,
                action: 'approve',
                deviationId: deviation.id,
                approver: approver,
              }),
              action_id: 'approve_action',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '❌ Reject',
                emoji: true,
              },
              style: 'danger',
              value: JSON.stringify({
                actionId: stepId,
                action: 'reject',
                deviationId: deviation.id,
                approver: approver,
              }),
              action_id: 'reject_action',
            },
          ],
        },
      ],
    };
  }

  /**
   * Sends an approval card to Microsoft Teams
   * Note: In production, this would make an actual API call to Microsoft Graph API
   */
  async sendToTeams(
    deviation: DeviationRecord,
    approverEmail: string,
    stepId: string
  ): Promise<void> {
    const card = this.generateTeamsCard(deviation, approverEmail, stepId);
    
    // In production, this would use Microsoft Graph API:
    // await fetch('https://graph.microsoft.com/v1.0/teams/{teamId}/channels/{channelId}/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(card),
    // });

    console.log('Teams Adaptive Card generated:', JSON.stringify(card, null, 2));
    
    // Mock: Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Card sent to Teams for approver: ${approverEmail}`);
        resolve();
      }, 500);
    });
  }

  /**
   * Sends an approval card to Slack
   * Note: In production, this would make an actual API call to Slack Web API
   */
  async sendToSlack(
    deviation: DeviationRecord,
    approverUserId: string,
    stepId: string,
    channelId: string
  ): Promise<void> {
    const card = this.generateSlackCard(deviation, approverUserId, stepId);
    
    // In production, this would use Slack Web API:
    // await fetch('https://slack.com/api/chat.postMessage', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${slackToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     channel: channelId,
    //     blocks: card.blocks,
    //   }),
    // });

    console.log('Slack Block Kit payload generated:', JSON.stringify(card, null, 2));
    
    // Mock: Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Card sent to Slack channel ${channelId} for approver: ${approverUserId}`);
        resolve();
      }, 500);
    });
  }

  /**
   * Handles an action response from Teams/Slack
   */
  async handleCardAction(
    response: CardActionResponse
  ): Promise<{ success: boolean; message: string }> {
    // In production, this would:
    // 1. Validate the action
    // 2. Update the deviation status in the database
    // 3. Send a confirmation message back to Teams/Slack
    // 4. Log the action for audit purposes

    console.log('Card action received:', response);

    return {
      success: true,
      message: `Action ${response.action} processed successfully`,
    };
  }

  /**
   * Generates a preview of the card (for UI display)
   */
  getCardPreview(
    deviation: DeviationRecord,
    platform: 'teams' | 'slack'
  ): { title: string; summary: string; payload: any } {
    const highestRPN = deviation.risks.length > 0
      ? Math.max(...deviation.risks.map(r => r.rpn))
      : 0;

    if (platform === 'teams') {
      const card = this.generateTeamsCard(deviation, 'Preview User', 'preview');
      return {
        title: 'Microsoft Teams Adaptive Card',
        summary: `Will be sent to approver's Teams channel with Approve/Reject buttons`,
        payload: card,
      };
    } else {
      const card = this.generateSlackCard(deviation, 'Preview User', 'preview');
      return {
        title: 'Slack Block Kit Card',
        summary: `Will be sent to approver's Slack channel with Approve/Reject buttons`,
        payload: card,
      };
    }
  }
}
