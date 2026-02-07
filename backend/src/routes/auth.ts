import { Router, Request, Response } from 'express';

const router = Router();

const DEFAULT_USER = {
  _id: '58c872aa3ce7d5fc688b49bc',
  name: 'Олег Кицюк',
  email: 'o_kytsuk@mail.ru',
  role: 'admin',
};

const DEFAULT_CLIENT = {
  _id: '58c872aa3ce7d5fc688b49bd',
  name: 'Loveiska Toys',
};

// Always return success - no auth needed
router.post('/login', (_req: Request, res: Response) => {
  res.json({ status: true, data: { user: DEFAULT_USER, client: DEFAULT_CLIENT } });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ status: true, message: 'Logged out' });
});

router.get('/status', (_req: Request, res: Response) => {
  res.json({ status: true, data: { isAuthenticated: true, user: DEFAULT_USER, client: DEFAULT_CLIENT } });
});

export default router;
