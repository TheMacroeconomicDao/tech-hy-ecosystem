use anchor_lang::prelude::*;

declare_id!("3oX2qbPpcWeHGfQknX8r1mwASpHCcZQLsoz2edNoHraV");

#[program]
pub mod tech_hy_contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
