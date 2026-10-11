import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planAutoShield } from './auto-shield-plan.ts';

test('fresh 0.05 SOL wallet registers, then deposits above 0.005 reserve',()=>{
 assert.deepEqual(planAutoShield(50_000_000n,'0.005',false),{action:'register'});
 assert.deepEqual(planAutoShield(49_995_000n,'0.005',true),{action:'deposit',amount:44_990_000n,amountSol:'0.04499'});
});
test('does not deposit below the minimum or consume the fee reserve',()=>{
 assert.deepEqual(planAutoShield(9_999_999n,'0.005',true),{action:'await_funds'});
 assert.deepEqual(planAutoShield(10_005_000n,'0.005',true),{action:'deposit',amount:5_000_000n,amountSol:'0.005'});
 assert.deepEqual(planAutoShield(0n,'0.005',false),{action:'await_funds'});
});
test('rejects unsafe fee reserve',()=>{
 assert.throws(()=>planAutoShield(50_000_000n,'0.004',true));
 assert.throws(()=>planAutoShield(50_000_000n,'0.0000000001',true));
});
