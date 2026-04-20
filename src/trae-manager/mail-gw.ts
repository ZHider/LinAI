import axios from 'axios';

const BASE_URL = 'https://api.mail.gw';

export interface MailAccount {
  id: string;
  address: string;
  password?: string;
  token?: string;
}

export interface MailMessage {
  id: string;
  from: {
    address: string;
    name: string;
  };
  subject: string;
  intro: string;
  createdAt: string;
}

export interface MailMessageDetail extends MailMessage {
  text: string;
  html: string[];
}

export class MailGwClient {
  private token: string = '';

  async getDomains(): Promise<string[]> {
    const res = await axios.get(`${BASE_URL}/domains`);
    return res.data['hydra:member'].map((d: any) => d.domain);
  }

  async createAccount(address: string, password: string): Promise<MailAccount> {
    const res = await axios.post(`${BASE_URL}/accounts`, {
      address,
      password,
    });
    return { ...res.data, password };
  }

  async login(address: string, password: string): Promise<string> {
    const res = await axios.post(`${BASE_URL}/token`, {
      address,
      password,
    });
    this.token = res.data.token;
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
  }

  async getMessages(): Promise<MailMessage[]> {
    const res = await axios.get(`${BASE_URL}/messages`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return res.data['hydra:member'];
  }

  async getMessage(id: string): Promise<MailMessageDetail> {
    const res = await axios.get(`${BASE_URL}/messages/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return res.data;
  }

  async deleteAccount(id: string): Promise<void> {
    await axios.delete(`${BASE_URL}/accounts/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
  }
}
