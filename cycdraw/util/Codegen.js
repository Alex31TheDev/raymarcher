const Codegen = {
    indentation: 4,

    getSpacing: _ => {
        return " ".repeat(Codegen.indentation);
    },

    indent: (code, times = 1) => {
        const spaces = Codegen.getSpacing();
        code = code.trim();

        let lines = code.split("\n");
        lines = lines.map(line => spaces.repeat(times) + line);

        return lines.join("\n");
    },

    statement: code => {
        if (typeof code === "undefined" || code.length < 1) {
            return ";";
        }

        code = code.trim();

        let replaced;
        const last_nl = code.lastIndexOf("\n");

        if (last_nl === -1) {
            replaced = code.replaceAll(" ", "");
        } else {
            replaced = code.slice(last_nl);
        }

        if (/[\s\S]+[\w\d$_)\]]$/.test(replaced)) {
            return code + ";";
        }

        return code;
    },

    return: value => {
        const name = "return";

        if (typeof value === "undefined" || value.length < 1) {
            return Codegen.statement(name);
        }

        if (Array.isArray(value)) {
            const values = value.map(x => x.trim()).join(", ");
            return Codegen.statement(`${name} [${values}]`);
        }

        value = value.toString().trim();
        return Codegen.statement(`${name} ${value}`);
    },

    closure: body => {
        const header = "(function() {\n",
            footer = Codegen.statement("})()");

        body = Codegen.indent(Codegen.statement(body));
        return header + body + "\n" + footer;
    },

    wrapScript: code => {
        const inputName = "img";

        const execCode = Codegen.closure(code),
            returnCode = Codegen.return(inputName);

        const wrapped = execCode + "\n\n" + returnCode;
        return Codegen.indent(wrapped);
    }
};

export default Codegen;
