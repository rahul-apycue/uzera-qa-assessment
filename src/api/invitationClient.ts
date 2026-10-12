import { APIRequestContext, APIResponse } from '@playwright/test';

export class InvitationClient {
  constructor(private request: APIRequestContext, private workspaceId: string) {}

  private get headers() {
    return { 'x-workspace-id': this.workspaceId };
  }

  async resetWorkspace(): Promise<APIResponse> {
    return this.request.post('/api/test/reset', { headers: this.headers });
  }

  async setPlan(plan: 'Free' | 'Premium'): Promise<APIResponse> {
    return this.request.post('/api/workspace/plan', {
      headers: this.headers,
      data: { plan },
    });
  }

  async sendInvitation(email: string): Promise<APIResponse> {
    return this.request.post('/api/team/invitations', {
      headers: this.headers,
      data: { email },
    });
  }

  async acceptInvitation(id: string): Promise<APIResponse> {
    return this.request.post(`/api/team/invitations/${id}/accept`, { headers: this.headers });
  }

  async updateInvitationStatus(id: string, status: 'pending' | 'accepted'): Promise<APIResponse> {
    return this.request.patch(`/api/team/invitations/${id}`, {
      headers: this.headers,
      data: { status },
    });
  }

  async getInvitations(): Promise<APIResponse> {
    return this.request.get('/api/team/invitations', { headers: this.headers });
  }

  async revokeInvitation(id: string): Promise<APIResponse> {
    return this.request.delete(`/api/team/invitations/${id}`, { headers: this.headers });
  }
}
