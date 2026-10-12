import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted';
}

interface WorkspaceState {
  plan: 'Free' | 'Premium';
  invitations: Invitation[];
}

const workspaces: Record<string, WorkspaceState> = {};

function getWorkspace(token: string): WorkspaceState {
  if (!workspaces[token]) {
    workspaces[token] = { plan: 'Free', invitations: [] };
  }
  return workspaces[token];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPlan(value: unknown): value is 'Free' | 'Premium' {
  return value === 'Free' || value === 'Premium';
}

app.post('/api/test/reset', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  workspaces[token] = { plan: 'Free', invitations: [] };
  res.status(200).json({ status: 'reset_success' });
});

app.get('/api/workspace/plan', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const ws = getWorkspace(token);
  return res.status(200).json({ plan: ws.plan });
});

app.post('/api/workspace/plan', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const { plan } = req.body ?? {};

  if (!isPlan(plan)) {
    return res.status(400).json({
      error: 'INVALID_PLAN',
      message: 'Plan must be either Free or Premium.',
    });
  }

  const ws = getWorkspace(token);
  ws.plan = plan;
  return res.status(200).json({ status: 'plan_updated', plan: ws.plan });
});

app.get('/api/team/invitations', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const ws = getWorkspace(token);
  return res.status(200).json({
    plan: ws.plan,
    totalCount: ws.invitations.length,
    invitations: ws.invitations,
  });
});

app.post('/api/team/invitations', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const ws = getWorkspace(token);

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'A valid email is required.' });
  }

  if (ws.plan === 'Free' && ws.invitations.length >= 2) {
    return res.status(403).json({
      error: 'LIMIT_EXCEEDED',
      message: 'Free plan allows up to 2 team member invites.',
    });
  }

  if (ws.invitations.some(i => normalizeEmail(i.email) === normalizeEmail(email))) {
    return res.status(409).json({ error: 'ALREADY_EXISTS', message: 'User is already invited.' });
  }

  const newInvitation: Invitation = {
    id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email,
    status: 'pending',
  };

  ws.invitations.push(newInvitation);
  return res.status(201).json(newInvitation);
});

function updateInvitationStatus(req: Request, res: Response): Response {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const { id } = req.params;
  const ws = getWorkspace(token);
  const invitation = ws.invitations.find(item => item.id === id);

  if (!invitation) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Invitation not found.' });
  }

  const nextStatus = req.body?.status;
  if (nextStatus !== undefined && nextStatus !== 'pending' && nextStatus !== 'accepted') {
    return res.status(400).json({ error: 'INVALID_STATUS', message: 'Status must be pending or accepted.' });
  }

  invitation.status = nextStatus === undefined ? 'accepted' : nextStatus;
  return res.status(200).json(invitation);
}

app.patch('/api/team/invitations/:id', (req: Request, res: Response) => {
  return updateInvitationStatus(req, res);
});

app.put('/api/team/invitations/:id', (req: Request, res: Response) => {
  return updateInvitationStatus(req, res);
});

app.post('/api/team/invitations/:id/accept', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const { id } = req.params;
  const ws = getWorkspace(token);
  const invitation = ws.invitations.find(item => item.id === id);

  if (!invitation) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Invitation not found.' });
  }

  invitation.status = 'accepted';
  return res.status(200).json(invitation);
});

app.post('/api/team/invitations/:id/revoke', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const { id } = req.params;
  const ws = getWorkspace(token);

  const initialLength = ws.invitations.length;
  ws.invitations = ws.invitations.filter(i => i.id !== id);

  if (ws.invitations.length === initialLength) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Invitation not found.' });
  }

  return res.status(200).json({ status: 'revoked', id });
});

app.delete('/api/team/invitations/:id', (req: Request, res: Response) => {
  const token = (req.headers['x-workspace-id'] as string) || 'default';
  const { id } = req.params;
  const ws = getWorkspace(token);

  const initialLength = ws.invitations.length;
  ws.invitations = ws.invitations.filter(i => i.id !== id);

  if (ws.invitations.length === initialLength) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Invitation not found.' });
  }

  return res.status(200).json({ status: 'revoked', id });
});

if (require.main === module) {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Uzera Mock API running on port ${PORT}`);
  });
}

export default app;
