source_root=$(pwd)
ci_source_root=../apaas-cicd-web
build_branch=$apaas_widgets_web_branch

ci_script_version=v1
lib_dependencies=(
    agora-rte-sdk
    agora-edu-core
    agora-common-libs
)

lib_versions=(
    2.9.2
    2.9.1
    2.9.3
)
lib_branches=(
    release/2.9.2
    release/2.9.1
    release/2.9.3
)

. ../apaas-cicd-web/utilities/tools.sh
. ../apaas-cicd-web/build/$ci_script_version/dependency.sh
. ../apaas-cicd-web/build/$ci_script_version/build.sh

if [ "$debug" == "true" ]; then
    # show environment variables
    echo "------------- variables --------------------"
    set
    echo "--------------------------------------------"
fi

download_packages $source_root $build_branch "${lib_dependencies[*]}" "${lib_versions[*]}" "${lib_branches[*]}"

make_monorepo $source_root "../fcr-ui-kit-desktop"

install_packages $source_root

build_lib $source_root $ci_source_root agora-plugin-gallery $build_branch
