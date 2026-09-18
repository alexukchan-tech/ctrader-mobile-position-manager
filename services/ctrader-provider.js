import { createClientAdapter } from "https://esm.sh/@spotware-web-team/sdk-external-api";
import { handleConfirmEvent, registerEvent, getAccountInformation, executionEvent } from "https://esm.sh/@spotware-web-team/sdk";
import { take, tap, catchError } from "https://esm.sh/rxjs/operators";
import { firstValueFrom, of } from "https://esm.sh/rxjs";

export class CTraderProvider {
  constructor({ logger = console } = {}) { this.logger=logger; this.mode="live"; this.connected=false; this.adapter=null; this.executionSubscription=null; }
  async connect() {
    this.adapter=createClientAdapter({logger:this.logger});
    handleConfirmEvent(this.adapter,{}).pipe(take(1)).subscribe();
    const result=await firstValueFrom(registerEvent(this.adapter).pipe(take(1),tap(()=>handleConfirmEvent(this.adapter,{}).pipe(take(1)).subscribe()),catchError(error=>of({error}))));
    if(result?.error) throw result.error;
    this.connected=true; return {mode:this.mode,connected:true};
  }
  async getAccountSnapshot(){ if(!this.connected||!this.adapter) throw new Error("The cTrader host is not connected."); return firstValueFrom(getAccountInformation(this.adapter,{}).pipe(take(1))); }
  subscribeToExecutionEvents(handler){ if(!this.connected||!this.adapter) throw new Error("The cTrader host is not connected."); this.executionSubscription?.unsubscribe?.(); this.executionSubscription=executionEvent(this.adapter).subscribe({next:handler,error:e=>this.logger.error?.("Execution event stream failed",e)}); return this.executionSubscription; }
  disconnect(){ this.executionSubscription?.unsubscribe?.(); this.executionSubscription=null; this.connected=false; }
  async closePosition(){ throw new Error("Live trading actions remain locked in the read-only build."); }
}
