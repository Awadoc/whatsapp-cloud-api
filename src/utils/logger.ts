/* eslint-disable no-console */
export class DebugLogger {
  private static isEnabled(): boolean {
    return process.env.DEBUG_WHATSAPP_CLOUD_API === 'true';
  }

  static logIncomingWebhook(payload: any): void {
    if (!this.isEnabled()) return;
    console.log('\n📥 [Incoming Webhook]');
    console.dir(payload, { depth: null, colors: true });
  }

  static logOutgoingRequest(request: any): void {
    if (!this.isEnabled()) return;
    console.log(
      `\n📤 [Outgoing Request] ${request.method?.toUpperCase()} ${request.url}`,
    );
    if (request.data) {
      console.log('Payload:');
      console.dir(request.data, { depth: null, colors: true });
    }
  }

  static logResponse(response: any): void {
    if (!this.isEnabled()) return;
    console.log(`\n✅ [Response] ${response.status} ${response.statusText}`);
    console.dir(response.data, { depth: null, colors: true });
  }

  static logError(error: any): void {
    if (!this.isEnabled()) return;
    console.error('\n❌ [Error]');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message || error);
    }
  }
}
