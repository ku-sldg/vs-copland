use rust_am_lib::copland::ASP::*;
use rust_am_lib::copland::Term::*;
use rust_am_lib::copland::ASP_PARAMS;
//use rust_am_lib::debug_print;

use serde_json::json;

#[allow(non_snake_case)]
fn string_to_SP (s:String) -> rust_am_lib::copland::SP {

    if s.eq(&String::from("+")) { return rust_am_lib::copland::SP::ALL }
    else {
        if s.eq(&String::from("-")) { return rust_am_lib::copland::SP::NONE }
        else { return rust_am_lib::copland::SP::NONE }
    }
}

#[allow(non_snake_case)]
fn strings_to_Split (s1:String, s2:String) -> rust_am_lib::copland::Split {

    return rust_am_lib::copland::Split { split1: string_to_SP(s1), split2: string_to_SP(s2) }
}

#[allow(non_snake_case)]
pub fn copland_concrete_to_ast (ct: grammar::CoplandTermConcrete) -> rust_am_lib::copland::Term {

    match ct {

        grammar::CoplandTermConcrete::Msp(aid, plc, tid) => 
            {
                let asp_params = ASP_PARAMS {ASP_ID: aid, ASP_ARGS: (json!({ })), ASP_PLC: plc, ASP_TARG_ID:tid};
                return asp (ASPC (asp_params))
            }

        grammar::CoplandTermConcrete::ParensTerm(_, innerCt, _) => 
            {
                return copland_concrete_to_ast(*innerCt)
            }

        grammar::CoplandTermConcrete::LinearTerm(leftCt, _, rightCt) => 
            {
                let left_ast = copland_concrete_to_ast(*leftCt);
                let right_ast = copland_concrete_to_ast(*rightCt);
                return rust_am_lib::copland::Term::lseq(Box::new(left_ast), Box::new(right_ast))
            }

        grammar::CoplandTermConcrete::BranchTerm(leftCt, sp1, _, sp2, rightCt) => 
            {
                let left_ast = copland_concrete_to_ast(*leftCt);
                let right_ast = copland_concrete_to_ast(*rightCt);
                let split= strings_to_Split(sp1, sp2);
                return rust_am_lib::copland::Term::bseq(split, Box::new(left_ast), Box::new(right_ast))
            }

        grammar::CoplandTermConcrete::AtTerm(_, plc, _, innerCt, _) => 
            {
                let inner_ast = copland_concrete_to_ast(*innerCt);
                return rust_am_lib::copland::Term::att(plc, Box::new(inner_ast))
            }
    }
}





#[rust_sitter::grammar("copland_concrete")]

pub mod grammar {
    //pub static PLC_PATTERN : &str = r"([a-z][a-zA-Z0-9_]*)|(\d+)";
    //const plc_pattern : &str = r"([a-z][a-zA-Z0-9_]*)|(\d+)";

    #[rust_sitter::language]
    #[derive(PartialEq, Eq, Debug)]


    pub enum CoplandTermConcrete {

        //#[rust_sitter::prec(3)]
        Msp(
        #[rust_sitter::leaf(pattern = r"[a-z][a-zA-Z0-9_]*", transform = |v| v.parse().unwrap())] String,
        #[rust_sitter::leaf(pattern = r"([a-z][a-zA-Z0-9_]*)|(\d+)", transform = |v| v.parse().unwrap())] String,
        #[rust_sitter::leaf(pattern = r"[a-z][a-zA-Z0-9_]*", transform = |v| v.parse().unwrap())] String,), 

        //#[rust_sitter::prec(5)]
        ParensTerm(
            #[rust_sitter::leaf(text = "(")] (), 

            Box<CoplandTermConcrete>,

            #[rust_sitter::leaf(text = ")")] (), 
        ),

        #[rust_sitter::prec_right(4)]
        LinearTerm(
            Box<CoplandTermConcrete>,

            #[rust_sitter::leaf(text = "->")] (), 

            Box<CoplandTermConcrete>,
        ),

        
        #[rust_sitter::prec_left(2)]
        BranchTerm(
            Box<CoplandTermConcrete>,

            #[rust_sitter::leaf(pattern = r"[+]|[-]", transform = |v| v.parse().unwrap())] String,
            #[rust_sitter::leaf(text = "<")] (), 
            #[rust_sitter::leaf(pattern = r"[+]|[-]", transform = |v| v.parse().unwrap())] String,

            Box<CoplandTermConcrete>,
        ),

        #[rust_sitter::prec(1)]
        AtTerm(
            #[rust_sitter::leaf(text = "@")] (), 
            #[rust_sitter::leaf(pattern = r"([a-z][a-zA-Z0-9_]*)|(\d+)", transform = |v| v.parse().unwrap())] String,
            #[rust_sitter::leaf(text = "[")] (), 
            Box<CoplandTermConcrete>,
            #[rust_sitter::leaf(text = "]")] ()
        )
    }

    #[rust_sitter::extra]
    struct Whitespace {
        #[rust_sitter::leaf(pattern = r"\s+")]
        _whitespace: (),
    }
}

/*
#[cfg(test)]
mod tests {
    use super::*;
    use grammar::Expression;

    #[wasm_bindgen_test::wasm_bindgen_test]
    #[test]
    fn successful_parses() {
        assert_eq!(grammar::parse("1").unwrap(), Expression::Number(1));

        assert_eq!(grammar::parse(" 1").unwrap(), Expression::Number(1));

        assert_eq!(
            grammar::parse("1 - 2").unwrap(),
            Expression::Sub(
                Box::new(Expression::Number(1)),
                (),
                Box::new(Expression::Number(2))
            )
        );

        assert_eq!(
            grammar::parse("1 - 2 - 3").unwrap(),
            Expression::Sub(
                Box::new(Expression::Sub(
                    Box::new(Expression::Number(1)),
                    (),
                    Box::new(Expression::Number(2))
                )),
                (),
                Box::new(Expression::Number(3))
            )
        );

        assert_eq!(
            grammar::parse("1 - 2 * 3").unwrap(),
            Expression::Sub(
                Box::new(Expression::Number(1)),
                (),
                Box::new(Expression::Mul(
                    Box::new(Expression::Number(2)),
                    (),
                    Box::new(Expression::Number(3))
                ))
            )
        );

        assert_eq!(
            grammar::parse("1 * 2 * 3").unwrap(),
            Expression::Mul(
                Box::new(Expression::Mul(
                    Box::new(Expression::Number(1)),
                    (),
                    Box::new(Expression::Number(2))
                )),
                (),
                Box::new(Expression::Number(3))
            )
        );

        assert_eq!(
            grammar::parse("1 * 2 - 3").unwrap(),
            Expression::Sub(
                Box::new(Expression::Mul(
                    Box::new(Expression::Number(1)),
                    (),
                    Box::new(Expression::Number(2))
                )),
                (),
                Box::new(Expression::Number(3))
            )
        );
    }

    #[test]
    fn failed_parses() {
        insta::assert_debug_snapshot!(grammar::parse("1 + 2"));
        insta::assert_debug_snapshot!(grammar::parse("1 - 2 -"));
        insta::assert_debug_snapshot!(grammar::parse("a1"));
        insta::assert_debug_snapshot!(grammar::parse("1a"));
    }
    
}
    */
