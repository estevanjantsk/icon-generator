import { cx } from "~/utils/cx"

export function FormGroup(props: React.ComponentPropsWithoutRef<"div">) {

  return (
    <div {...props} className={cx("flex flex-col gap-1", props.className)}>
      {props.children}
    </div>
  )
}